export type SeedBriefing = {
  summary: string;
  itemsProcessed: number;
  relationshipsFound: number;
  briefingDate: string;
  createdAt: Date;
};

function formatDate(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function briefingDateTime(daysAgo: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(9, 0, 0, 0);
  return date;
}

const SUMMARIES = [
  "NVIDIA and TSMC dominated today's signal: a supply chain mention on Blackwell capacity plus a partnership note on packaging. Medium-confidence Apple–Google search news is worth monitoring.",
  "Microsoft–OpenAI investment and product collaboration headlines led the briefing. One lower-confidence AMD mention appeared in a peripheral supplier article.",
  "Alphabet showed up across two partnership articles while Apple supply chain coverage linked TSMC and Samsung. Three relationships cleared the high-confidence threshold.",
  "NVIDIA remained the hub ticker: edges to Meta, Amazon, and Oracle suggest a densely connected AI infrastructure graph. Briefing found five relationships across four types.",
  "Executive mentions outnumbered partnerships today. Microsoft and Apple leadership quotes referenced long-term vendor commitments with TSMC and OpenAI.",
  "A quieter day with two medium-confidence supply chain items involving Qualcomm and Apple. No high-impact investment headlines in the watchlist scope.",
  "Google and Samsung product collaboration news anchored the briefing. TSMC supply chain coverage added a second high-confidence relationship for NVIDIA.",
  "Investment and partnership types tied for the top slot. OpenAI–Microsoft and NVIDIA–Oracle stories were the strongest signals in today's scan.",
  "Low-confidence executive mention noise increased in peripheral coverage, but three high-confidence supply chain relationships involving NVDA and TSM stood out.",
  "Apple and Alphabet partnership renewal remained the headline relationship. Secondary supply chain mentions connected Apple to Samsung component flows.",
  "Broadcom and NVIDIA supply chain linkage plus Meta's GPU procurement article produced a useful graph expansion beyond the core watchlist pairs.",
  "Microsoft Azure and AMD co-development coverage was the lead story. Two additional medium-confidence product collaboration items involved Google and Samsung.",
  "Intel foundry commentary created a low-confidence edge to NVIDIA — flagged for follow-up. TSMC supply chain mention stayed high confidence.",
  "Amazon AWS GPU expansion and NVIDIA reference architecture news reinforced cloud infrastructure relationships across the watchlist.",
  "A balanced mix across all five relationship types today. NVIDIA remained the most connected node with four separate extracted edges.",
  "Tesla autonomy evaluation of NVIDIA DRIVE was today's surprise peripheral item. Core watchlist coverage still centered on TSMC manufacturing capacity.",
  "Oracle sovereign cloud partnership with NVIDIA led the briefing. Executive mention coverage from Apple praised TSMC execution metrics.",
  "OpenAI enterprise compliance tooling with Microsoft was the top investment signal. Secondary partnership news linked Google and Apple on search defaults.",
  "AMD versus NVIDIA competitive coverage produced medium-confidence edges but no confirmed partnership. Supply chain articles involving TSM were stronger.",
  "Weekend catch-up scan found fewer articles but retained a high-confidence Microsoft–OpenAI product collaboration and an Apple–Google partnership mention.",
] as const;

export function buildDemoBriefings(): SeedBriefing[] {
  const briefingDays = [
    0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15, 17, 18, 19, 21, 22, 24,
    25, 27, 28, 29,
  ];

  return briefingDays.map((daysAgo, index) => ({
    summary: SUMMARIES[index % SUMMARIES.length],
    itemsProcessed: 6 + (index % 10),
    relationshipsFound: 2 + (index % 7),
    briefingDate: formatDate(daysAgo),
    createdAt: briefingDateTime(daysAgo),
  }));
}