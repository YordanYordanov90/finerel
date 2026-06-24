import { config } from "dotenv";

config({ path: ".env.local" });

import { eq, like } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "@/lib/db/schema";
import { buildDemoBriefings } from "./seed-data/briefings";
import { buildDemoNewsItems } from "./seed-data/news-items";
import { buildDemoRelationships } from "./seed-data/relationships";

const {
  briefings,
  newsItems,
  relationships,
  users,
  watchlists,
} = schema;

const DEMO_EMAIL = "demo@finrel.dev";
const FALLBACK_DEMO_USER_ID = "user_demo_finrel";
const DEMO_WATCHLIST = ["NVDA", "TSMC", "AAPL", "MSFT", "GOOGL"] as const;

function getDemoUserId(): string {
  const demoUserId = process.env.DEMO_USER_ID?.trim();

  if (!demoUserId) {
    console.warn(
      `DEMO_USER_ID is not set — using fallback id "${FALLBACK_DEMO_USER_ID}". Set DEMO_USER_ID in .env.local to your Clerk demo user.`,
    );
    return FALLBACK_DEMO_USER_ID;
  }

  return demoUserId;
}

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in .env.local");
  }

  return databaseUrl;
}

async function clearDemoData(
  db: ReturnType<typeof drizzle<typeof schema>>,
  userId: string,
) {
  await db.delete(relationships).where(like(relationships.sourceNewsId, "demo-news-%"));
  await db.delete(newsItems).where(like(newsItems.id, "demo-news-%"));
  const userIds = new Set([userId, FALLBACK_DEMO_USER_ID, DEMO_EMAIL]);
  for (const id of userIds) {
    await db.delete(relationships).where(eq(relationships.userId, id));
    await db.delete(briefings).where(eq(briefings.userId, id));
    await db.delete(newsItems).where(eq(newsItems.userId, id));
    await db.delete(watchlists).where(eq(watchlists.userId, id));
  }
}

async function seedDemo() {
  const userId = getDemoUserId();
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const db = drizzle(pool, { schema });

  console.log("Seeding users...");
  await db
    .insert(users)
    .values({
      id: userId,
      email: DEMO_EMAIL,
      briefingTime: "09:00",
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: DEMO_EMAIL,
        briefingTime: "09:00",
        updatedAt: new Date(),
      },
    });

  await clearDemoData(db, userId);

  console.log("Seeding watchlist...");
  await db.insert(watchlists).values(
    DEMO_WATCHLIST.map((ticker) => ({
      userId,
      ticker,
    })),
  );

  const news = buildDemoNewsItems();
  console.log("Seeding news items...");
  const BATCH_SIZE = 20;
  for (let i = 0; i < news.length; i += BATCH_SIZE) {
    const batch = news.slice(i, i + BATCH_SIZE);
    await db.insert(newsItems).values(
      batch.map((item) => ({
        id: item.id,
        userId,
        headline: item.headline,
        summary: item.summary,
        url: item.url,
        source: item.source,
        publishedAt: item.publishedAt,
        mentionedTickers: item.mentionedTickers,
        rawContentHash: item.rawContentHash,
      })),
    );
  }

  const briefingRows = buildDemoBriefings();
  console.log("Seeding briefings...");
  const insertedBriefings = await db
    .insert(briefings)
    .values(
      briefingRows.map((briefing) => ({
        userId,
        summary: briefing.summary,
        itemsProcessed: briefing.itemsProcessed,
        relationshipsFound: briefing.relationshipsFound,
        briefingDate: briefing.briefingDate,
        createdAt: briefing.createdAt,
      })),
    )
    .returning({
      id: briefings.id,
      briefingDate: briefings.briefingDate,
    });

  const briefingIdByDate = new Map(
    insertedBriefings.map((briefing) => [briefing.briefingDate, briefing.id]),
  );

  const relationshipRows = buildDemoRelationships();
  console.log("Seeding relationships...");
  for (let i = 0; i < relationshipRows.length; i += BATCH_SIZE) {
    const batch = relationshipRows.slice(i, i + BATCH_SIZE);
    await db.insert(relationships).values(
      batch.map((relationship) => ({
        userId,
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
        extractedAt: relationship.extractedAt,
        briefingId: briefingIdByDate.get(relationship.briefingDate) ?? null,
      })),
    );
  }

  console.log("Done.");
  console.log(
    `Seeded demo user ${userId}: ${DEMO_WATCHLIST.length} tickers, ${news.length} news items, ${insertedBriefings.length} briefings, ${relationshipRows.length} relationships.`,
  );

  await pool.end();
}

seedDemo().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exit(1);
});