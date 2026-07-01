// Lightweight descriptor of the dashboard view a chat turn was sent from.
// Used by the docked Ask panel to seed the agent (feature 27 → page-context
// seeding). It is a hint only — never trusted for access or scope (the route
// derives userId from the session; see 26-chat-api-route.md).

export type PageChatContext = {
  page: string;
  focus?: { ticker?: string };
};

const KNOWN_PAGES = [
  "overview",
  "graph",
  "news",
  "history",
  "watchlist",
  "settings",
] as const;

type KnownPage = (typeof KNOWN_PAGES)[number];

function isKnownPage(value: string): value is KnownPage {
  return (KNOWN_PAGES as readonly string[]).includes(value);
}

// Derive context from the current pathname. Returns null on the chat page
// itself (no underlying view to describe) and on unknown routes.
export function derivePageContext(pathname: string): PageChatContext | null {
  const segment = pathname.replace(/^\/+/, "").split("/")[0] || "overview";

  if (!isKnownPage(segment)) {
    return null;
  }

  return { page: segment };
}
