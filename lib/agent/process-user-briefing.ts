import { extractRelationships } from "@/lib/agent/tools/extract-relationships";
import { fetchWatchlistNews } from "@/lib/agent/tools/fetch-watchlist-news";
import { sendBriefingEmail } from "@/lib/agent/tools/send-briefing-email";
import { storeRelationships } from "@/lib/agent/tools/store-relationships";
import { type NewsItem } from "@/lib/schemas/news";
import {
  extractionOutputSchema,
  type ExtractionOutput,
} from "@/lib/schemas/relationships";

const FALLBACK_SUMMARY = "No new relationships found today.";

// extract_relationships caps input at 50 items per call (see core-intelligence-spec
// §1). Larger batches must be chunked before calling the tool, or the input parse
// throws and the run silently falls back to an empty briefing.
const EXTRACTION_BATCH_SIZE = 50;

function buildFallbackOutput(
  userId: string,
  itemsProcessed = 0,
): ExtractionOutput {
  return extractionOutputSchema.parse({
    relationships: [],
    summary: FALLBACK_SUMMARY,
    itemsProcessed,
    userId,
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function mergeExtractionOutputs(
  userId: string,
  outputs: ExtractionOutput[],
  itemsProcessed: number,
): ExtractionOutput {
  const relationships = outputs.flatMap((o) => o.relationships);

  // Use the summary from the batch that surfaced the most relationships;
  // fall back to the standard line when no batch found anything.
  const bestSummary = outputs
    .filter((o) => o.relationships.length > 0)
    .sort((a, b) => b.relationships.length - a.relationships.length)[0]?.summary;

  return extractionOutputSchema.parse({
    relationships,
    summary: bestSummary ?? FALLBACK_SUMMARY,
    itemsProcessed,
    userId,
  });
}

async function extractInBatches(
  userId: string,
  tickers: string[],
  items: NewsItem[],
): Promise<ExtractionOutput> {
  const batches = chunk(items, EXTRACTION_BATCH_SIZE);
  const outputs: ExtractionOutput[] = [];

  for (const batch of batches) {
    // extractRelationships catches its own errors and returns a fallback,
    // so a single bad batch never aborts the rest of the run.
    outputs.push(
      await extractRelationships({
        newsItems: batch,
        focusTickers: tickers,
        userId,
      }),
    );
  }

  return mergeExtractionOutputs(userId, outputs, items.length);
}

export async function processUserBriefing(
  userId: string,
  tickers: string[],
): Promise<void> {
  let output = buildFallbackOutput(userId);
  let newsItems: NewsItem[] = [];

  try {
    const fetchResult = await fetchWatchlistNews({ userId, tickers });
    newsItems = fetchResult.newsItems;

    if (fetchResult.newsItems.length === 0) {
      output = buildFallbackOutput(userId);
    } else {
      try {
        output = await extractInBatches(userId, tickers, fetchResult.newsItems);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "unknown extraction error";

        console.error("[morning-briefing] extract failed", {
          userId,
          itemCount: fetchResult.newsItems.length,
          error: message,
        });

        output = buildFallbackOutput(userId, fetchResult.newsItems.length);
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown fetch error";

    console.error("[morning-briefing] fetch failed", {
      userId,
      error: message,
    });
  }

  try {
    await storeRelationships(output);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown store error";

    console.error("[morning-briefing] store failed", {
      userId,
      error: message,
    });
  }

  try {
    await sendBriefingEmail(output, newsItems);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown email error";

    console.warn("[morning-briefing] email failed", {
      userId,
      error: message,
    });
  }
}