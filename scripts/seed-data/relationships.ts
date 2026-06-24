import type { ImpactLevel, RelationType } from "@/lib/schemas/relationships";

export type SeedRelationship = {
  sourceCompany: string;
  sourceTicker: string | null;
  targetCompany: string;
  targetTicker: string | null;
  relationType: RelationType;
  confidence: number;
  impactLevel: ImpactLevel;
  contextSnippet: string;
  sourceNewsId: string;
  sourceUrl: string;
  extractedAt: Date;
  briefingDate: string;
};

type Company = {
  name: string;
  ticker: string | null;
};

const COMPANIES: Record<string, Company> = {
  NVDA: { name: "NVIDIA", ticker: "NVDA" },
  TSMC: { name: "TSMC", ticker: "TSMC" },
  AAPL: { name: "Apple", ticker: "AAPL" },
  MSFT: { name: "Microsoft", ticker: "MSFT" },
  GOOGL: { name: "Alphabet", ticker: "GOOGL" },
  AMD: { name: "AMD", ticker: "AMD" },
  INTC: { name: "Intel", ticker: "INTC" },
  AMZN: { name: "Amazon", ticker: "AMZN" },
  META: { name: "Meta", ticker: "META" },
  ORCL: { name: "Oracle", ticker: "ORCL" },
  QCOM: { name: "Qualcomm", ticker: "QCOM" },
  AVGO: { name: "Broadcom", ticker: "AVGO" },
  TSLA: { name: "Tesla", ticker: "TSLA" },
  OPENAI: { name: "OpenAI", ticker: null },
  SAMSUNG: { name: "Samsung", ticker: null },
};

const CONFIDENCE_TIERS = [
  ...Array.from({ length: 24 }, (_, index) => 0.82 + (index % 14) * 0.01),
  ...Array.from({ length: 24 }, (_, index) => 0.55 + (index % 24) * 0.01),
  ...Array.from({ length: 12 }, (_, index) => 0.22 + (index % 12) * 0.02),
] as const;

const IMPACT_LEVELS: ImpactLevel[] = ["high", "medium", "low"];

const RELATION_PAIRS: Array<{
  source: keyof typeof COMPANIES;
  target: keyof typeof COMPANIES;
  relationType: RelationType;
  snippet: string;
}> = [
  {
    source: "NVDA",
    target: "TSMC",
    relationType: "supply_chain",
    snippet:
      "TSMC confirmed expanded wafer capacity for NVIDIA's Blackwell generation, reinforcing the primary manufacturing link between the two firms.",
  },
  {
    source: "MSFT",
    target: "OPENAI",
    relationType: "investment",
    snippet:
      "Microsoft extended its strategic OpenAI partnership with additional Azure capacity commitments tied to enterprise model deployment.",
  },
  {
    source: "AAPL",
    target: "GOOGL",
    relationType: "partnership",
    snippet:
      "Apple renewed its default search distribution agreement with Google, preserving a multi-billion-dollar partnership central to iOS monetization.",
  },
  {
    source: "NVDA",
    target: "ORCL",
    relationType: "partnership",
    snippet:
      "Oracle and NVIDIA announced sovereign AI cloud regions combining OCI infrastructure with DGX systems for regulated enterprise customers.",
  },
  {
    source: "META",
    target: "NVDA",
    relationType: "supply_chain",
    snippet:
      "Meta detailed expanded NVIDIA H100 purchases to accelerate recommendation model training across its advertising stack.",
  },
  {
    source: "AMZN",
    target: "NVDA",
    relationType: "product_collaboration",
    snippet:
      "AWS launched additional p5 regions featuring NVIDIA H100 instances optimized for large-model inference workloads.",
  },
  {
    source: "AMD",
    target: "MSFT",
    relationType: "product_collaboration",
    snippet:
      "AMD and Microsoft introduced co-developed Azure instance profiles tuned for cost-sensitive enterprise inference deployments.",
  },
  {
    source: "GOOGL",
    target: "SAMSUNG",
    relationType: "product_collaboration",
    snippet:
      "Google and Samsung will ship Gemini-powered on-device AI features on select Galaxy hardware before broader Android rollout.",
  },
  {
    source: "AAPL",
    target: "TSMC",
    relationType: "supply_chain",
    snippet:
      "Apple operations leadership credited TSMC manufacturing yields as critical to meeting launch targets for advanced iPhone silicon.",
  },
  {
    source: "QCOM",
    target: "AAPL",
    relationType: "supply_chain",
    snippet:
      "Qualcomm confirmed continued modem chipset shipments for upcoming Apple product cycles despite ongoing in-house silicon development.",
  },
  {
    source: "NVDA",
    target: "AMD",
    relationType: "partnership",
    snippet:
      "Industry coverage compared NVIDIA and AMD roadmap alignment with hyperscaler custom silicon programs, noting renewed competitive partnership dynamics.",
  },
  {
    source: "INTC",
    target: "NVDA",
    relationType: "supply_chain",
    snippet:
      "Intel executives pitched advanced packaging services as an alternative path for AI accelerator customers evaluating second-source options.",
  },
  {
    source: "NVDA",
    target: "OPENAI",
    relationType: "product_collaboration",
    snippet:
      "OpenAI training clusters referenced NVIDIA H100 racks in documentation for its latest frontier model refresh cycle.",
  },
  {
    source: "MSFT",
    target: "NVDA",
    relationType: "partnership",
    snippet:
      "Microsoft Azure expanded its NVIDIA AI Enterprise software catalog, deepening the platform partnership for corporate GPT deployments.",
  },
  {
    source: "GOOGL",
    target: "NVDA",
    relationType: "supply_chain",
    snippet:
      "Alphabet secured additional NVIDIA accelerators for Google Cloud TPU companion clusters handling burst inference demand.",
  },
  {
    source: "AAPL",
    target: "SAMSUNG",
    relationType: "supply_chain",
    snippet:
      "Supply chain trackers flagged renewed Samsung display driver orders tied to Apple's next-generation handset roadmap.",
  },
  {
    source: "AVGO",
    target: "NVDA",
    relationType: "supply_chain",
    snippet:
      "Broadcom networking silicon appeared in NVIDIA reference architecture documents for large-scale AI rack designs.",
  },
  {
    source: "TSLA",
    target: "NVDA",
    relationType: "product_collaboration",
    snippet:
      "Tesla engineering teams evaluated NVIDIA DRIVE Thor platforms for a future autonomy hardware revision.",
  },
  {
    source: "MSFT",
    target: "GOOGL",
    relationType: "executive_mention",
    snippet:
      "A Microsoft executive referenced competitive collaboration boundaries with Google during a cloud AI strategy briefing.",
  },
  {
    source: "AAPL",
    target: "OPENAI",
    relationType: "executive_mention",
    snippet:
      "An Apple executive declined to comment on potential OpenAI integrations while emphasizing on-device privacy priorities.",
  },
];

function company(key: keyof typeof COMPANIES): Company {
  return COMPANIES[key];
}

function formatDate(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function extractedAt(daysAgo: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(9, 15, 0, 0);
  return date;
}

function impactForConfidence(confidence: number): ImpactLevel {
  if (confidence >= 0.8) {
    return "high";
  }

  if (confidence >= 0.5) {
    return "medium";
  }

  return "low";
}

function rotateType(index: number): RelationType {
  const types: RelationType[] = [
    "partnership",
    "supply_chain",
    "executive_mention",
    "product_collaboration",
    "investment",
  ];

  return types[index % types.length];
}

function buildGeneratedSnippet(
  source: Company,
  target: Company,
  relationType: RelationType,
): string {
  const phrases: Record<RelationType, string> = {
    partnership:
      `${source.name} and ${target.name} were cited in coverage describing a strategic partnership spanning multiple product lines.`,
    supply_chain:
      `${source.name} depends on ${target.name} for critical component supply, according to analysts tracking manufacturing commitments.`,
    executive_mention:
      `A ${source.name} executive referenced ${target.name} while discussing long-term vendor strategy during a public briefing.`,
    product_collaboration:
      `${source.name} and ${target.name} teams collaborated on an integrated product launch aimed at enterprise AI buyers.`,
    investment:
      `Coverage framed ${source.name}'s relationship with ${target.name} as a strategic investment deepened by recent financing activity.`,
  };

  return phrases[relationType];
}

export function buildDemoRelationships(): SeedRelationship[] {
  const relationships: SeedRelationship[] = [];
  const companyKeys = Object.keys(COMPANIES) as Array<keyof typeof COMPANIES>;

  RELATION_PAIRS.forEach((pair, index) => {
    const confidence = CONFIDENCE_TIERS[index % CONFIDENCE_TIERS.length];
    const daysAgo = index % 30;
    const source = company(pair.source);
    const target = company(pair.target);
    const newsId = `demo-news-${String(index + 1).padStart(3, "0")}`;

    relationships.push({
      sourceCompany: source.name,
      sourceTicker: source.ticker,
      targetCompany: target.name,
      targetTicker: target.ticker,
      relationType: pair.relationType,
      confidence,
      impactLevel: impactForConfidence(confidence),
      contextSnippet: pair.snippet,
      sourceNewsId: newsId,
      sourceUrl: `https://finrel.news/demo/${newsId}`,
      extractedAt: extractedAt(daysAgo),
      briefingDate: formatDate(daysAgo),
    });
  });

  for (let index = RELATION_PAIRS.length; index < 60; index += 1) {
    const sourceKey = companyKeys[index % companyKeys.length];
    const targetKey = companyKeys[(index + 3) % companyKeys.length];
    const relationType = rotateType(index);
    const confidence = CONFIDENCE_TIERS[index];
    const daysAgo = index % 30;
    const source = company(sourceKey);
    const target = company(targetKey);
    const newsId = `demo-news-${String(index + 1).padStart(3, "0")}`;

    if (source.name === target.name) {
      continue;
    }

    relationships.push({
      sourceCompany: source.name,
      sourceTicker: source.ticker,
      targetCompany: target.name,
      targetTicker: target.ticker,
      relationType,
      confidence,
      impactLevel: IMPACT_LEVELS[index % IMPACT_LEVELS.length],
      contextSnippet: buildGeneratedSnippet(source, target, relationType),
      sourceNewsId: newsId,
      sourceUrl: `https://finrel.news/demo/${newsId}`,
      extractedAt: extractedAt(daysAgo),
      briefingDate: formatDate(daysAgo),
    });
  }

  while (relationships.length < 60) {
    const index = relationships.length;
    const sourceKey = companyKeys[index % companyKeys.length];
    const targetKey = companyKeys[(index + 5) % companyKeys.length];
    const source = company(sourceKey);
    const target = company(targetKey);
    const newsId = `demo-news-${String(index + 1).padStart(3, "0")}`;

    relationships.push({
      sourceCompany: source.name,
      sourceTicker: source.ticker,
      targetCompany: target.name,
      targetTicker: target.ticker,
      relationType: rotateType(index),
      confidence: CONFIDENCE_TIERS[index % CONFIDENCE_TIERS.length],
      impactLevel: impactForConfidence(CONFIDENCE_TIERS[index % CONFIDENCE_TIERS.length]),
      contextSnippet: buildGeneratedSnippet(source, target, rotateType(index)),
      sourceNewsId: newsId,
      sourceUrl: `https://finrel.news/demo/${newsId}`,
      extractedAt: extractedAt(index % 30),
      briefingDate: formatDate(index % 30),
    });
  }

  return relationships.slice(0, 60);
}