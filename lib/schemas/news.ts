import { z } from "zod";

export const newsItemSchema = z.object({
  id: z.string(),
  headline: z.string(),
  summary: z.string(),
  url: z.string().url(),
  source: z.string(),
  publishedAt: z.string(),
  mentionedTickers: z.array(z.string()),
});

export const fetchNewsInputSchema = z.object({
  tickers: z.array(z.string().min(1).max(5)).min(1),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limitPerTicker: z.number().int().positive().max(50).optional().default(25),
  userId: z.string(),
});

export const fetchNewsOutputSchema = z.object({
  newsItems: z.array(newsItemSchema),
});

export const finnhubArticleSchema = z.object({
  category: z.string().optional(),
  datetime: z.number(),
  headline: z.string().min(1),
  id: z.number(),
  image: z.string().optional(),
  related: z.string().optional(),
  source: z.string().min(1),
  summary: z.string(),
  url: z.string().url(),
});

export const finnhubNewsResponseSchema = z.array(finnhubArticleSchema);

export type NewsItem = z.infer<typeof newsItemSchema>;
export type FetchNewsInput = z.infer<typeof fetchNewsInputSchema>;
export type FetchNewsOutput = z.infer<typeof fetchNewsOutputSchema>;
export type FinnhubArticle = z.infer<typeof finnhubArticleSchema>;