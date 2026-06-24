import { z } from "zod";

export const addWatchlistTickerSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(5)
    .regex(/^[A-Za-z.]+$/, "Ticker must contain only letters and dots")
    .transform((value) => value.toUpperCase()),
});

export const watchlistTickerSchema = z.object({
  ticker: z.string(),
  addedAt: z.string(),
});

export const watchlistListResponseSchema = z.object({
  tickers: z.array(watchlistTickerSchema),
});

export type AddWatchlistTickerInput = z.infer<typeof addWatchlistTickerSchema>;
export type WatchlistTicker = z.infer<typeof watchlistTickerSchema>;
export type WatchlistListResponse = z.infer<typeof watchlistListResponseSchema>;