import { auth } from "@clerk/nextjs/server";
import { and, count, desc, eq, gte, lte, or } from "drizzle-orm";

import { db, relationships } from "@/lib/db";
import { relationshipsQuerySchema } from "@/lib/schemas/api-params";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams);
  const parsed = relationshipsQuerySchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return Response.json({ error: message }, { status: 400 });
  }

  const { ticker, relationType, minConfidence, startDate, endDate, limit, offset } = parsed.data;

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
    conditions.push(lte(relationships.extractedAt, new Date(endDate)));
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
    db
      .select({ total: count() })
      .from(relationships)
      .where(where),
  ]);

  return Response.json({
    data: {
      relationships: rows.map((r) => ({
        id: r.id,
        sourceCompany: r.sourceCompany,
        sourceTicker: r.sourceTicker,
        targetCompany: r.targetCompany,
        targetTicker: r.targetTicker,
        relationType: r.relationType,
        confidence: r.confidence,
        impactLevel: r.impactLevel,
        contextSnippet: r.contextSnippet,
        sourceUrl: r.sourceUrl,
        extractedAt: r.extractedAt.toISOString(),
      })),
      total,
    },
  });
}
