UPDATE "users" SET "briefingTime" = '09:00' WHERE "briefingTime" = '07:00';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "briefingTime" SET DEFAULT '09:00';