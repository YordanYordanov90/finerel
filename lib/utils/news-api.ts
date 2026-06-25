export type NewsArticle = {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  mentionedTickers: string[];
};

type NewsResponse = {
  data: {
    news: NewsArticle[];
  };
};

type ApiErrorBody = {
  error?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("Server error — please try again");
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as ApiErrorBody).error === "string"
        ? (body as ApiErrorBody).error
        : "Request failed";
    throw new Error(message);
  }

  return body as T;
}

export async function fetchNews(
  options: { isDemo?: boolean; refresh?: boolean } = {},
): Promise<NewsArticle[]> {
  const params = new URLSearchParams();

  if (options.isDemo) {
    params.set("demo", "true");
  }

  if (options.refresh) {
    params.set("refresh", "true");
  }

  const query = params.toString();
  const response = await fetch(`/api/news${query ? `?${query}` : ""}`);
  const body = await parseResponse<NewsResponse>(response);
  return body.data.news;
}

export function formatNewsDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "Just now";
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
