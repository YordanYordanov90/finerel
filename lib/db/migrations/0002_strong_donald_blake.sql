CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"threadId" text NOT NULL,
	"role" text NOT NULL,
	"parts" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_threadId_chat_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_messages_thread_created" ON "chat_messages" USING btree ("threadId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_chat_threads_user_updated" ON "chat_threads" USING btree ("userId","updatedAt");