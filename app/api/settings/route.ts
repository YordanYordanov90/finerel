import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db, users } from "@/lib/db";

const updateSettingsSchema = z.object({
  briefingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Briefing time must be in HH:MM format")
    .refine((v) => {
      const [h, m] = v.split(":").map(Number);
      return h >= 0 && h <= 23 && m >= 0 && m <= 59;
    }, "Briefing time is not a valid time"),
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [user] = await db
      .select({ briefingTime: users.briefingTime })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      data: {
        briefingTime: user.briefingTime,
      },
    });
  } catch (error) {
    console.error("[api/settings] database error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    await db
      .update(users)
      .set({ briefingTime: parsed.data.briefingTime, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return Response.json({
      data: {
        briefingTime: parsed.data.briefingTime,
      },
    });
  } catch (error) {
    console.error("[api/settings] database error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}