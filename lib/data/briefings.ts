import { count, desc, eq } from "drizzle-orm";

import { briefings, db } from "@/lib/db";

const SUMMARY_MAX = 500;

export type BriefingRecord = {
  id: number;
  summary: string;
  itemsProcessed: number;
  relationshipsFound: number;
  briefingDate: string;
  createdAt: string;
};

export type BriefingsResult = {
  briefings: BriefingRecord[];
  total: number;
};

export async function queryBriefings(
  userId: string,
  params: { limit: number; offset?: number },
): Promise<BriefingsResult> {
  const { limit, offset = 0 } = params;
  const where = eq(briefings.userId, userId);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: briefings.id,
        summary: briefings.summary,
        itemsProcessed: briefings.itemsProcessed,
        relationshipsFound: briefings.relationshipsFound,
        briefingDate: briefings.briefingDate,
        createdAt: briefings.createdAt,
      })
      .from(briefings)
      .where(where)
      .orderBy(desc(briefings.briefingDate))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(briefings).where(where),
  ]);

  return {
    briefings: rows.map((row) => ({
      id: row.id,
      summary: row.summary.slice(0, SUMMARY_MAX),
      itemsProcessed: row.itemsProcessed,
      relationshipsFound: row.relationshipsFound,
      briefingDate: row.briefingDate,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
  };
}