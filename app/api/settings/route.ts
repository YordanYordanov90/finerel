import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db, users } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}