import { Resend } from "resend";
import { eq } from "drizzle-orm";

import { env } from "@/lib/agent/env";
import {
  buildBriefingHtml,
  buildBriefingText,
} from "@/lib/agent/tools/briefing-email-template";
import { db, users } from "@/lib/db";
import { type NewsItem } from "@/lib/schemas/news";
import {
  extractionOutputSchema,
  type ExtractionOutput,
} from "@/lib/schemas/relationships";

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

export async function sendBriefingEmail(
  output: ExtractionOutput,
  newsItems: NewsItem[] = [],
): Promise<void> {
  const input = extractionOutputSchema.parse(output);

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
      html: buildBriefingHtml(input.summary, input.relationships, newsItems),
      text: buildBriefingText(input.summary, input.relationships, newsItems),
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
