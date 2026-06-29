import { auth, currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { getAuthOrDemoUserId, isDemoUser } from "@/lib/auth";
import { db, users, watchlists } from "@/lib/db";
import { addWatchlistTickerSchema } from "@/lib/schemas/watchlist";

export async function GET(request: Request) {
  const userId = await getAuthOrDemoUserId(request);

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db
      .select({ ticker: watchlists.ticker, addedAt: watchlists.addedAt })
      .from(watchlists)
      .where(eq(watchlists.userId, userId))
      .orderBy(desc(watchlists.addedAt));

    return Response.json({
      data: {
        tickers: rows.map((row) => ({
          ticker: row.ticker,
          addedAt: row.addedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[api/watchlist] database error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoUser(userId)) {
    return Response.json(
      { error: "Demo account is read-only" },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = addWatchlistTickerSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return Response.json({ error: message }, { status: 400 });
  }

  const { ticker } = parsed.data;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? "";

  try {
    await db
      .insert(users)
      .values({ id: userId, email })
      .onConflictDoUpdate({
        target: users.id,
        set: { email },
        setWhere: sql`${email} != ''`,
      });

    const existing = await db
      .select({ id: watchlists.id })
      .from(watchlists)
      .where(and(eq(watchlists.userId, userId), eq(watchlists.ticker, ticker)))
      .limit(1);

    if (existing.length > 0) {
      return Response.json(
        { error: "Ticker already in watchlist" },
        { status: 400 },
      );
    }

    const [inserted] = await db
      .insert(watchlists)
      .values({ userId, ticker })
      .returning({
        ticker: watchlists.ticker,
        addedAt: watchlists.addedAt,
      });

    return Response.json(
      {
        data: {
          ticker: inserted.ticker,
          addedAt: inserted.addedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/watchlist] database error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}