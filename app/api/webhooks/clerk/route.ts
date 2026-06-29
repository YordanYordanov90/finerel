import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { sql } from "drizzle-orm";

import { db, users } from "@/lib/db";
import {
  clerkUserCreatedEventSchema,
  getPrimaryEmail,
} from "@/lib/schemas/clerk-webhook";

export async function POST(request: NextRequest) {
  let event;

  try {
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("Clerk webhook verification failed", error);
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type !== "user.created") {
    return new Response("Success", { status: 200 });
  }

  const parsed = clerkUserCreatedEventSchema.safeParse(event);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid payload";
    return Response.json({ error: message }, { status: 400 });
  }

  const userData = parsed.data.data;
  const email = getPrimaryEmail(userData);

  try {
    await db
      .insert(users)
      .values({ id: userData.id, email })
      .onConflictDoUpdate({
        target: users.id,
        set: { email },
        setWhere: sql`${email} != ''`,
      });
  } catch (error) {
    console.error("[api/webhooks/clerk] database error", {
      error: error instanceof Error ? error.message : "unknown",
      userId: userData.id,
    });
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return new Response("Success", { status: 200 });
}