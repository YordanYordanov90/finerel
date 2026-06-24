import { z } from "zod";

import { relationTypeSchema } from "@/lib/schemas/relationships";

export const RELATION_TYPES = relationTypeSchema.options;

export const historyFiltersSchema = z.object({
  relationTypes: z.array(relationTypeSchema),
  minConfidence: z.number().min(0).max(1).nullable(),
  startDate: z.string(),
  endDate: z.string(),
  ticker: z
    .string()
    .max(5)
    .transform((value) => value.toUpperCase().trim()),
});

export type HistoryFilters = z.infer<typeof historyFiltersSchema>;

export const defaultHistoryFilters: HistoryFilters = {
  relationTypes: [],
  minConfidence: null,
  startDate: "",
  endDate: "",
  ticker: "",
};

export function parseHistoryFilters(input: HistoryFilters): HistoryFilters {
  return historyFiltersSchema.parse(input);
}