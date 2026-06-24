import { count, desc, eq } from "drizzle-orm";

import { getAuthOrDemoUserId } from "@/lib/auth";
import { briefings, db } from "@/lib/db";
import { briefingsQuerySchema } from "@/lib/schemas/api-params";

export async function GET(request: Request) {
  const userId = await getAuthOrDemoUserId(request);

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams);
  const parsed = briefingsQuerySchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return Response.json({ error: message }, { status: 400 });
  }

  const { limit, offset } = parsed.data;
  const where = eq(briefings.userId, userId);

  try {
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
      db
        .select({ total: count() })
        .from(briefings)
        .where(where),
    ]);

    return Response.json({
      data: {
        briefings: rows.map((b) => ({
          id: b.id,
          summary: b.summary,
          itemsProcessed: b.itemsProcessed,
          relationshipsFound: b.relationshipsFound,
          briefingDate: b.briefingDate,
          createdAt: b.createdAt.toISOString(),
        })),
        total,
      },
    });
  } catch (error) {
    console.error("[api/briefings] database error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
