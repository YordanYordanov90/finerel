import { z } from "zod";

import { db, briefings, relationships } from "@/lib/db";
import { extractionOutputSchema } from "@/lib/schemas/relationships";

export const storeRelationshipsOutputSchema = z.object({
  briefingId: z.number(),
  relationshipsStored: z.number(),
});

export type StoreRelationshipsOutput = z.infer<
  typeof storeRelationshipsOutputSchema
>;

function toBriefingDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function storeRelationships(
  rawInput: unknown,
): Promise<StoreRelationshipsOutput> {
  const output = extractionOutputSchema.parse(rawInput);

  const [briefing] = await db
    .insert(briefings)
    .values({
      userId: output.userId,
      summary: output.summary,
      itemsProcessed: output.itemsProcessed,
      relationshipsFound: output.relationships.length,
      briefingDate: toBriefingDate(),
    })
    .returning({ id: briefings.id });

  if (output.relationships.length > 0) {
    await db.insert(relationships).values(
      output.relationships.map((relationship) => ({
        userId: output.userId,
        sourceCompany: relationship.sourceCompany,
        sourceTicker: relationship.sourceTicker,
        targetCompany: relationship.targetCompany,
        targetTicker: relationship.targetTicker,
        relationType: relationship.relationType,
        confidence: relationship.confidence,
        impactLevel: relationship.impactLevel,
        contextSnippet: relationship.contextSnippet,
        sourceNewsId: relationship.sourceNewsId,
        sourceUrl: relationship.sourceUrl,
        extractedAt: new Date(relationship.extractedAt),
        briefingId: briefing.id,
      })),
    );
  }

  return storeRelationshipsOutputSchema.parse({
    briefingId: briefing.id,
    relationshipsStored: output.relationships.length,
  });
}