import { getAuthOrDemoUserId } from "@/lib/auth";
import { queryRelationships } from "@/lib/data/relationships";
import { relationshipsQuerySchema } from "@/lib/schemas/api-params";

export async function GET(request: Request) {
  const userId = await getAuthOrDemoUserId(request);

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

  const {
    ticker,
    relationType,
    minConfidence,
    startDate,
    endDate,
    briefingId,
    limit,
    offset,
  } = parsed.data;

  try {
    const result = await queryRelationships(userId, {
      ticker,
      relationType,
      minConfidence,
      startDate,
      endDate,
      briefingId,
      limit,
      offset,
    });

    return Response.json({ data: result });
  } catch (error) {
    console.error("[api/relationships] database error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}