CREATE TABLE "briefings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"summary" text NOT NULL,
	"itemsProcessed" integer NOT NULL,
	"relationshipsFound" integer NOT NULL,
	"briefingDate" date NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"canonicalName" text NOT NULL,
	"ticker" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_canonicalName_unique" UNIQUE("canonicalName")
);
--> statement-breakpoint
CREATE TABLE "news_items" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"headline" text NOT NULL,
	"summary" text NOT NULL,
	"url" text NOT NULL,
	"source" text NOT NULL,
	"publishedAt" timestamp NOT NULL,
	"mentionedTickers" text[] NOT NULL,
	"rawContentHash" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"sourceCompany" text NOT NULL,
	"sourceTicker" text,
	"targetCompany" text NOT NULL,
	"targetTicker" text,
	"relationType" text NOT NULL,
	"confidence" real NOT NULL,
	"impactLevel" text NOT NULL,
	"contextSnippet" text NOT NULL,
	"sourceNewsId" text NOT NULL,
	"sourceUrl" text NOT NULL,
	"extractedAt" timestamp NOT NULL,
	"briefingId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"briefingTime" text DEFAULT '07:00' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"ticker" text NOT NULL,
	"addedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watchlists_userId_ticker_unique" UNIQUE("userId","ticker")
);
--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_sourceNewsId_news_items_id_fk" FOREIGN KEY ("sourceNewsId") REFERENCES "public"."news_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_briefingId_briefings_id_fk" FOREIGN KEY ("briefingId") REFERENCES "public"."briefings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_briefings_user_date" ON "briefings" USING btree ("userId","briefingDate");--> statement-breakpoint
CREATE INDEX "idx_news_items_hash" ON "news_items" USING btree ("rawContentHash");--> statement-breakpoint
CREATE INDEX "idx_relationships_user_ticker" ON "relationships" USING btree ("userId","sourceTicker");--> statement-breakpoint
CREATE INDEX "idx_relationships_user_type" ON "relationships" USING btree ("userId","relationType");--> statement-breakpoint
CREATE INDEX "idx_watchlists_user" ON "watchlists" USING btree ("userId");