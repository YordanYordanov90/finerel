import { Resend } from "resend";
import { z } from "zod";

import { env } from "@/lib/agent/env";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

const sendBriefingEmailInputSchema = z.object({
  userId: z.string(),
  summary: z.string(),
});

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "briefing@finrel.dev";

const resend = new Resend(env.RESEND_API_KEY);

function formatBriefingDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildEmailBody(summary: string): string {
  return `FinRel Morning Briefing

${summary}

—
FinRel — your watchlist relationship intelligence`;
}

export async function sendBriefingEmail(
  userId: string,
  summary: string,
): Promise<void> {
  const input = sendBriefingEmailInputSchema.parse({ userId, summary });

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  if (!user) {
    console.warn("[send_briefing_email] user not found", {
      userId: input.userId,
    });
    return;
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `FinRel Morning Briefing — ${formatBriefingDate()}`,
      text: buildEmailBody(input.summary),
    });

    if (result.error) {
      console.warn("[send_briefing_email] send failed", {
        userId: input.userId,
        error: result.error.message,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown email error";

    console.warn("[send_briefing_email] send failed", {
      userId: input.userId,
      error: message,
    });
  }
}