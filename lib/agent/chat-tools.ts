import { tool } from "ai";
import { z } from "zod";

import { queryBriefings } from "@/lib/data/briefings";
import { getGraphStats } from "@/lib/data/graph-stats";
import { searchNews } from "@/lib/data/news";
import { queryRelationships } from "@/lib/data/relationships";
import { getWatchlist } from "@/lib/data/watchlist";
import {
  briefingsQuerySchema,
  relationshipsQuerySchema,
} from "@/lib/schemas/api-params";

type ToolError = { error: string };

const chatRelationshipsQuerySchema = relationshipsQuerySchema.omit({
  briefingId: true,
  offset: true,
});

const chatBriefingsQuerySchema = briefingsQuerySchema.omit({ offset: true });

const newsSearchQuerySchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(5)
    .transform((value) => value.toUpperCase())
    .optional(),
  query: z.string().min(1).max(100).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(30).default(15),
});

function toolError(message: string): ToolError {
  return { error: message };
}

export function buildChatTools(userId: string) {
  return {
    get_watchlist: tool({
      description:
        "Return the user's stock watchlist tickers and when each was added.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const tickers = await getWatchlist(userId);
          return { tickers };
        } catch (error) {
          console.error("[chat-tools/get_watchlist] failed", {
            userId,
            error: error instanceof Error ? error.message : "unknown",
          });
          return toolError("Could not load watchlist.");
        }
      },
    }),

    query_relationships: tool({
      description:
        "Search the user's extracted company relationships. Filter by ticker, relation type, confidence, or date range.",
      inputSchema: chatRelationshipsQuerySchema,
      execute: async (input) => {
        try {
          return await queryRelationships(userId, input);
        } catch (error) {
          console.error("[chat-tools/query_relationships] failed", {
            userId,
            error: error instanceof Error ? error.message : "unknown",
          });
          return toolError("Could not load relationships.");
        }
      },
    }),

    get_graph_stats: tool({
      description:
        "Return summary statistics about the user's relationship graph: node and edge counts, most-connected companies, relation-type breakdown, and watchlist coverage.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          return await getGraphStats(userId);
        } catch (error) {
          console.error("[chat-tools/get_graph_stats] failed", {
            userId,
            error: error instanceof Error ? error.message : "unknown",
          });
          return toolError("Could not load graph statistics.");
        }
      },
    }),

    search_news: tool({
      description:
        "Search the user's stored news articles. Filter by ticker, keyword, or date range.",
      inputSchema: newsSearchQuerySchema,
      execute: async (input) => {
        try {
          const news = await searchNews(userId, input);
          return { news };
        } catch (error) {
          console.error("[chat-tools/search_news] failed", {
            userId,
            error: error instanceof Error ? error.message : "unknown",
          });
          return toolError("Could not search news.");
        }
      },
    }),

    get_briefing_history: tool({
      description:
        "Return the user's past morning briefing summaries with items processed and relationships found.",
      inputSchema: chatBriefingsQuerySchema,
      execute: async (input) => {
        try {
          return await queryBriefings(userId, { limit: input.limit });
        } catch (error) {
          console.error("[chat-tools/get_briefing_history] failed", {
            userId,
            error: error instanceof Error ? error.message : "unknown",
          });
          return toolError("Could not load briefing history.");
        }
      },
    }),
  };
}