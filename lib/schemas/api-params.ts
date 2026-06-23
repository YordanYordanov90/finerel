import { z } from "zod";

import { relationTypeSchema } from "@/lib/schemas/relationships";

export const relationshipsQuerySchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(5)
    .transform((v) => v.toUpperCase())
    .optional(),
  relationType: relationTypeSchema.optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const briefingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type RelationshipsQuery = z.infer<typeof relationshipsQuerySchema>;
export type BriefingsQuery = z.infer<typeof briefingsQuerySchema>;
