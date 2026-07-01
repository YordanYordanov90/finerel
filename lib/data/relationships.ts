import { and, count, desc, eq, gte, lte, or } from "drizzle-orm";

import { db, relationships } from "@/lib/db";
import type { RelationshipsQuery } from "@/lib/schemas/api-params";

const SNIPPET_MAX = 300;

export type RelationshipRecord = {
  id: number;
  sourceCompany: string;
  sourceTicker: string | null;
  targetCompany: string;
  targetTicker: string | null;
  relationType: string;
  confidence: number;
  impactLevel: string;
  contextSnippet: string;
  sourceUrl: string;
  extractedAt: string;
};

export type RelationshipsResult = {
  relationships: RelationshipRecord[];
  total: number;
};

function toRecord(row: typeof relationships.$inferSelect): RelationshipRecord {
  return {
    id: row.id,
    sourceCompany: row.sourceCompany,
    sourceTicker: row.sourceTicker,
    targetCompany: row.targetCompany,
    targetTicker: row.targetTicker,
    relationType: row.relationType,
    confidence: row.confidence,
    impactLevel: row.impactLevel,
    contextSnippet: row.contextSnippet.slice(0, SNIPPET_MAX),
    sourceUrl: row.sourceUrl,
    extractedAt: row.extractedAt.toISOString(),
  };
}

export type RelationshipsQueryParams = Pick<
  RelationshipsQuery,
  | "ticker"
  | "relationType"
  | "minConfidence"
  | "startDate"
  | "endDate"
  | "briefingId"
  | "limit"
> & {
  offset?: number;
};

export async function queryRelationships(
  userId: string,
  params: RelationshipsQueryParams,
): Promise<RelationshipsResult> {
  const {
    ticker,
    relationType,
    minConfidence,
    startDate,
    endDate,
    briefingId,
    limit,
    offset = 0,
  } = params;

  const conditions = [eq(relationships.userId, userId)];

  if (ticker) {
    conditions.push(
      or(
        eq(relationships.sourceTicker, ticker),
        eq(relationships.targetTicker, ticker),
      )!,
    );
  }

  if (relationType) {
    conditions.push(eq(relationships.relationType, relationType));
  }

  if (minConfidence !== undefined) {
    conditions.push(gte(relationships.confidence, minConfidence));
  }

  if (startDate) {
    conditions.push(gte(relationships.extractedAt, new Date(startDate)));
  }

  if (endDate) {
    conditions.push(
      lte(relationships.extractedAt, new Date(`${endDate}T23:59:59.999Z`)),
    );
  }

  if (briefingId !== undefined) {
    conditions.push(eq(relationships.briefingId, briefingId));
  }

  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(relationships)
      .where(where)
      .orderBy(desc(relationships.extractedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(relationships).where(where),
  ]);

  return {
    relationships: rows.map(toRecord),
    total,
  };
}