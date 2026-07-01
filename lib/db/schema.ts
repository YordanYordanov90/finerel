import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  briefingTime: text("briefingTime").default("09:00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const watchlists = pgTable(
  "watchlists",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    ticker: text("ticker").notNull(),
    addedAt: timestamp("addedAt").defaultNow().notNull(),
  },
  (table) => [
    unique("watchlists_userId_ticker_unique").on(table.userId, table.ticker),
    index("idx_watchlists_user").on(table.userId),
  ],
);

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  canonicalName: text("canonicalName").notNull().unique(),
  ticker: text("ticker"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const newsItems = pgTable(
  "news_items",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    headline: text("headline").notNull(),
    summary: text("summary").notNull(),
    url: text("url").notNull(),
    source: text("source").notNull(),
    publishedAt: timestamp("publishedAt").notNull(),
    mentionedTickers: text("mentionedTickers").array().notNull(),
    rawContentHash: text("rawContentHash").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("idx_news_items_hash").on(table.rawContentHash)],
);

export const briefings = pgTable(
  "briefings",
  {
    id: serial("id").primaryKey(),
    userId: text("userId").notNull(),
    summary: text("summary").notNull(),
    itemsProcessed: integer("itemsProcessed").notNull(),
    relationshipsFound: integer("relationshipsFound").notNull(),
    briefingDate: date("briefingDate").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_briefings_user_date").on(table.userId, table.briefingDate),
  ],
);

export const relationships = pgTable(
  "relationships",
  {
    id: serial("id").primaryKey(),
    userId: text("userId").notNull(),
    sourceCompany: text("sourceCompany").notNull(),
    sourceTicker: text("sourceTicker"),
    targetCompany: text("targetCompany").notNull(),
    targetTicker: text("targetTicker"),
    relationType: text("relationType").notNull(),
    confidence: real("confidence").notNull(),
    impactLevel: text("impactLevel").notNull(),
    contextSnippet: text("contextSnippet").notNull(),
    sourceNewsId: text("sourceNewsId")
      .notNull()
      .references(() => newsItems.id),
    sourceUrl: text("sourceUrl").notNull(),
    extractedAt: timestamp("extractedAt").notNull(),
    briefingId: integer("briefingId").references(() => briefings.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_relationships_user_ticker").on(table.userId, table.sourceTicker),
    index("idx_relationships_user_type").on(table.userId, table.relationType),
  ],
);

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    title: text("title"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_chat_threads_user_updated").on(table.userId, table.updatedAt),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    threadId: text("threadId")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    parts: jsonb("parts").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_chat_messages_thread_created").on(table.threadId, table.createdAt),
  ],
);

export const chatThreadsRelations = relations(chatThreads, ({ many }) => ({
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [chatMessages.threadId],
    references: [chatThreads.id],
  }),
}));