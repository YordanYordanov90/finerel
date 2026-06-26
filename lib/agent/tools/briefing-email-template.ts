import type { NewsItem } from "@/lib/schemas/news";
import type {
  ExtractedRelationship,
  ImpactLevel,
  RelationType,
} from "@/lib/schemas/relationships";

// On quiet days (no new relationships) the email surfaces the headlines the
// agent scanned, so the briefing always carries value.
const MAX_HEADLINES = 8;
const MAX_TICKERS_PER_HEADLINE = 4;

const RELATION_LABELS: Record<RelationType, string> = {
  partnership: "Partnership",
  supply_chain: "Supply chain",
  executive_mention: "Executive mention",
  product_collaboration: "Product collaboration",
  investment: "Investment",
};

const IMPACT_COLORS: Record<ImpactLevel, string> = {
  high: "#f87171",
  medium: "#fbbf24",
  low: "#71717a",
};

// Brand + neutral palette (kept inline-safe for email clients).
const BG = "#0a0a0a";
const CARD_BG = "#111111";
const BORDER = "#27272a";
const TEXT = "#e4e4e7";
const MUTED = "#a1a1aa";
const CYAN = "#67e8f9";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBriefingDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function relationshipParty(company: string, ticker?: string): string {
  const safeCompany = escapeHtml(company);

  if (!ticker) {
    return `<span style="color:${TEXT};font-weight:600;">${safeCompany}</span>`;
  }

  return `<span style="color:${TEXT};font-weight:600;">${safeCompany}</span> <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:12px;color:${CYAN};">${escapeHtml(
    ticker,
  )}</span>`;
}

function renderRelationship(rel: ExtractedRelationship): string {
  const label = RELATION_LABELS[rel.relationType] ?? rel.relationType;
  const impactColor = IMPACT_COLORS[rel.impactLevel] ?? MUTED;
  const confidencePct = Math.round(rel.confidence * 100);

  return `
  <tr>
    <td style="padding:0 0 12px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CARD_BG};border:1px solid ${BORDER};border-radius:8px;">
        <tr>
          <td style="padding:16px 18px;">
            <div style="font-size:15px;line-height:1.5;margin-bottom:10px;">
              ${relationshipParty(rel.sourceCompany, rel.sourceTicker)}
              <span style="color:${MUTED};padding:0 6px;">&rarr;</span>
              ${relationshipParty(rel.targetCompany, rel.targetTicker)}
            </div>
            <div style="margin-bottom:10px;">
              <span style="display:inline-block;font-size:11px;color:${CYAN};border:1px solid ${BORDER};border-radius:4px;padding:2px 8px;margin-right:6px;">${label}</span>
              <span style="display:inline-block;font-size:11px;color:${impactColor};margin-right:6px;">${rel.impactLevel} impact</span>
              <span style="display:inline-block;font-size:11px;color:${MUTED};">${confidencePct}% confidence</span>
            </div>
            <div style="font-size:13px;line-height:1.5;color:${MUTED};margin-bottom:10px;">
              ${escapeHtml(rel.contextSnippet)}
            </div>
            <a href="${escapeHtml(rel.sourceUrl)}" style="font-size:12px;color:${CYAN};text-decoration:none;">Read source &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function prepareHeadlines(newsItems: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const unique: NewsItem[] = [];

  for (const item of newsItems) {
    const key = item.headline.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_HEADLINES);
}

function renderTickerPills(tickers: string[]): string {
  return tickers
    .slice(0, MAX_TICKERS_PER_HEADLINE)
    .map(
      (ticker) =>
        `<span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;color:${CYAN};margin-left:6px;">${escapeHtml(
          ticker,
        )}</span>`,
    )
    .join("");
}

function renderHeadline(item: NewsItem): string {
  return `
  <tr>
    <td style="padding:0 0 10px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CARD_BG};border:1px solid ${BORDER};border-radius:8px;">
        <tr>
          <td style="padding:14px 16px;">
            <a href="${escapeHtml(
              item.url,
            )}" style="font-size:14px;line-height:1.45;color:${TEXT};text-decoration:none;font-weight:600;">${escapeHtml(
              item.headline,
            )}</a>
            <div style="margin-top:8px;font-size:11px;color:${MUTED};">
              ${escapeHtml(item.source)}${renderTickerPills(item.mentionedTickers)}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderHeadlinesBlock(newsItems: NewsItem[]): string {
  const headlines = prepareHeadlines(newsItems);

  if (headlines.length === 0) {
    return `
      <tr>
        <td style="padding:8px 0;">
          <div style="font-size:14px;color:${MUTED};">
            No new relationships found today.
          </div>
        </td>
      </tr>`;
  }

  return `
      <tr>
        <td style="padding:8px 0 4px 0;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${MUTED};margin-bottom:12px;">
            Today's watchlist headlines (${headlines.length})
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${headlines.map(renderHeadline).join("")}
          </table>
        </td>
      </tr>`;
}

export function buildBriefingHtml(
  summary: string,
  relationships: ExtractedRelationship[],
  newsItems: NewsItem[] = [],
): string {
  const date = formatBriefingDate();

  const relationshipsBlock =
    relationships.length > 0
      ? `
      <tr>
        <td style="padding:8px 0 4px 0;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${MUTED};margin-bottom:12px;">
            Relationships found (${relationships.length})
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${relationships.map(renderRelationship).join("")}
          </table>
        </td>
      </tr>`
      : renderHeadlinesBlock(newsItems);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background-color:${BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding-bottom:24px;border-bottom:1px solid ${BORDER};">
              <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;">
                <span style="color:${TEXT};">Fin</span><span style="color:${CYAN};">Rel</span>
              </div>
              <div style="font-size:14px;color:${TEXT};margin-top:8px;">Morning Briefing</div>
              <div style="font-size:12px;color:${MUTED};margin-top:2px;">${date}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0;">
              <div style="font-size:14px;line-height:1.6;color:${TEXT};">
                ${escapeHtml(summary)}
              </div>
            </td>
          </tr>
          ${relationshipsBlock}
          <tr>
            <td style="padding-top:24px;border-top:1px solid ${BORDER};">
              <div style="font-size:11px;color:${MUTED};line-height:1.5;">
                FinRel &mdash; your watchlist relationship intelligence.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildBriefingText(
  summary: string,
  relationships: ExtractedRelationship[],
  newsItems: NewsItem[] = [],
): string {
  const lines = [`FinRel Morning Briefing`, ``, summary, ``];

  if (relationships.length > 0) {
    lines.push(`Relationships found (${relationships.length}):`, ``);

    for (const rel of relationships) {
      const source = rel.sourceTicker
        ? `${rel.sourceCompany} (${rel.sourceTicker})`
        : rel.sourceCompany;
      const target = rel.targetTicker
        ? `${rel.targetCompany} (${rel.targetTicker})`
        : rel.targetCompany;
      const label = RELATION_LABELS[rel.relationType] ?? rel.relationType;
      const confidencePct = Math.round(rel.confidence * 100);

      lines.push(
        `• ${source} → ${target}`,
        `  ${label} · ${rel.impactLevel} impact · ${confidencePct}% confidence`,
        `  ${rel.contextSnippet}`,
        `  ${rel.sourceUrl}`,
        ``,
      );
    }
  } else {
    const headlines = prepareHeadlines(newsItems);

    if (headlines.length > 0) {
      lines.push(`Today's watchlist headlines (${headlines.length}):`, ``);

      for (const item of headlines) {
        const tickers = item.mentionedTickers
          .slice(0, MAX_TICKERS_PER_HEADLINE)
          .join(", ");
        const meta = tickers ? `${item.source} · ${tickers}` : item.source;

        lines.push(`• ${item.headline}`, `  ${meta}`, `  ${item.url}`, ``);
      }
    }
  }

  lines.push(`—`, `FinRel — your watchlist relationship intelligence`);

  return lines.join("\n");
}
