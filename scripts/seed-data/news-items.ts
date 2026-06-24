import { createHash } from "crypto";

export type SeedNewsItem = {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
  mentionedTickers: string[];
  rawContentHash: string;
};

function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

function newsItem(
  index: number,
  headline: string,
  summary: string,
  source: string,
  publishedAt: Date,
  mentionedTickers: string[],
): SeedNewsItem {
  const id = `demo-news-${String(index).padStart(3, "0")}`;
  const url = `https://finrel.news/demo/${id}`;

  return {
    id,
    headline,
    summary,
    url,
    source,
    publishedAt,
    mentionedTickers,
    rawContentHash: hashUrl(url),
  };
}

export function buildDemoNewsItems(): SeedNewsItem[] {
  const items: SeedNewsItem[] = [
    newsItem(
      1,
      "TSMC expands NVIDIA Blackwell wafer production capacity",
      "Taiwan Semiconductor confirmed additional capacity allocation for NVIDIA's next-generation AI chips.",
      "Reuters",
      daysAgo(1),
      ["NVDA", "TSMC"],
    ),
    newsItem(
      2,
      "Microsoft deepens OpenAI partnership with new Azure capacity deal",
      "Microsoft announced expanded cloud infrastructure commitments tied to OpenAI model training.",
      "Bloomberg",
      daysAgo(2),
      ["MSFT"],
    ),
    newsItem(
      3,
      "Apple and Google renew default search agreement",
      "Apple extended its long-running search distribution partnership with Alphabet's Google unit.",
      "WSJ",
      daysAgo(3),
      ["AAPL", "GOOGL"],
    ),
    newsItem(
      4,
      "NVIDIA CEO highlights supply chain resilience with TSMC",
      "Jensen Huang referenced TSMC as a critical manufacturing partner during the GTC keynote.",
      "CNBC",
      daysAgo(4),
      ["NVDA", "TSMC"],
    ),
    newsItem(
      5,
      "AMD and Microsoft co-develop inference-optimized Azure instances",
      "The companies unveiled joint hardware profiles for enterprise AI workloads on Azure.",
      "The Verge",
      daysAgo(5),
      ["AMD", "MSFT"],
    ),
    newsItem(
      6,
      "Alphabet invests in expanded Google Cloud TPU supply chain",
      "Google secured multi-year component agreements to support TPU deployment growth.",
      "Financial Times",
      daysAgo(6),
      ["GOOGL"],
    ),
    newsItem(
      7,
      "Apple sources advanced display drivers from Samsung",
      "Supply chain analysts noted renewed Samsung component orders for upcoming iPhone lines.",
      "Nikkei Asia",
      daysAgo(7),
      ["AAPL"],
    ),
    newsItem(
      8,
      "Qualcomm supplies modem chips for next Apple product cycle",
      "Qualcomm confirmed continued modem shipments despite Apple's in-house silicon push.",
      "Reuters",
      daysAgo(8),
      ["QCOM", "AAPL"],
    ),
    newsItem(
      9,
      "NVIDIA and Oracle launch sovereign AI cloud regions",
      "Oracle Cloud Infrastructure will host NVIDIA DGX systems for regulated industries.",
      "Oracle News",
      daysAgo(9),
      ["NVDA", "ORCL"],
    ),
    newsItem(
      10,
      "Meta adopts NVIDIA H100 clusters for recommendation training",
      "Meta detailed expanded GPU purchases to accelerate ranking model refresh cycles.",
      "TechCrunch",
      daysAgo(10),
      ["META", "NVDA"],
    ),
    newsItem(
      11,
      "Amazon Web Services expands NVIDIA GPU availability",
      "AWS added new p5 instance regions backed by NVIDIA H100 accelerators.",
      "AWS Blog",
      daysAgo(11),
      ["AMZN", "NVDA"],
    ),
    newsItem(
      12,
      "Intel foundry pitch targets NVIDIA packaging alternatives",
      "Intel executives discussed advanced packaging options for AI accelerator customers.",
      "Barron's",
      daysAgo(12),
      ["INTC", "NVDA"],
    ),
    newsItem(
      13,
      "Microsoft Teams integrates OpenAI realtime voice features",
      "A product update introduced conversational voice assistance across Teams channels.",
      "Microsoft Blog",
      daysAgo(13),
      ["MSFT"],
    ),
    newsItem(
      14,
      "Google and Samsung announce Android AI feature collaboration",
      "Gemini-powered on-device features will ship on select Galaxy devices first.",
      "Samsung Newsroom",
      daysAgo(14),
      ["GOOGL"],
    ),
    newsItem(
      15,
      "Broadcom supplies networking silicon for NVIDIA AI racks",
      "Broadcom switch chips were named in NVIDIA reference architecture documents.",
      "SDxCentral",
      daysAgo(15),
      ["AVGO", "NVDA"],
    ),
    newsItem(
      16,
      "Tesla explores NVIDIA DRIVE deployment for next autonomy stack",
      "Engineering teams evaluated NVIDIA DRIVE Thor for future vehicle platforms.",
      "Electrek",
      daysAgo(16),
      ["TSLA", "NVDA"],
    ),
    newsItem(
      17,
      "Apple executive praises TSMC manufacturing execution",
      "An operations lead credited TSMC yields during a supplier responsibility briefing.",
      "Apple Newsroom",
      daysAgo(17),
      ["AAPL", "TSMC"],
    ),
    newsItem(
      18,
      "OpenAI and Microsoft align on enterprise compliance tooling",
      "New admin controls target regulated customers deploying GPT models on Azure.",
      "OpenAI Blog",
      daysAgo(18),
      ["MSFT"],
    ),
    newsItem(
      19,
      "Alphabet and Apple discuss on-device search alternatives",
      "Regulatory filings hinted at continued negotiations over iOS search defaults.",
      "Bloomberg Law",
      daysAgo(19),
      ["GOOGL", "AAPL"],
    ),
    newsItem(
      20,
      "NVIDIA and AMD compete for hyperscaler custom silicon deals",
      "Analysts compared roadmap timelines for merchant GPU versus semi-custom designs.",
      "SemiAnalysis",
      daysAgo(20),
      ["NVDA", "AMD"],
    ),
  ];

  const templates = [
    ["Partnership expands AI research collaboration", "Two technology leaders signed a framework to co-develop enterprise AI tooling.", "Reuters"],
    ["Supply chain agreement covers next-gen components", "Manufacturing partners outlined multi-year component and packaging commitments.", "Nikkei Asia"],
    ["Executive cites strategic vendor relationship", "A senior executive highlighted a long-running supplier partnership during earnings.", "CNBC"],
    ["Product teams launch integrated cloud offering", "Joint engineering produced a bundled solution for regulated enterprise buyers.", "TechCrunch"],
    ["Investment round strengthens platform ecosystem", "A strategic investment deepened integration between platform and model providers.", "Bloomberg"],
  ] as const;

  const tickers = ["NVDA", "TSMC", "AAPL", "MSFT", "GOOGL", "AMD", "INTC", "AMZN", "META", "ORCL"];

  for (let index = 21; index <= 65; index += 1) {
    const template = templates[(index - 21) % templates.length];
    const tickerA = tickers[(index - 21) % tickers.length];
    const tickerB = tickers[(index - 19) % tickers.length];

    items.push(
      newsItem(
        index,
        `${tickerA} / ${tickerB}: ${template[0]}`,
        template[1],
        template[2],
        daysAgo(index % 30),
        [tickerA, tickerB],
      ),
    );
  }

  return items;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(8, 0, 0, 0);
  return date;
}