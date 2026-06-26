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
        output = await extractRelationships({
          newsItems: fetchResult.newsItems,
          focusTickers: tickers,
          userId,
        });
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