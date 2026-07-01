import { openai } from "@ai-sdk/openai";

export const models = {
  extraction: openai("gpt-4.1-mini"),
  briefing: openai("gpt-4.1-mini"),
  verification: openai("gpt-4.1-mini"),
  // Interactive chat agent — flagship general model for stronger synthesis.
  // GPT-5 is reasoning-capable; keep reasoning effort low at the call site
  // (app/api/chat/route.ts) so the interactive stream stays snappy within the
  // 60s Hobby cap and the 5-step tool loop.
  chat: openai("gpt-5"),
} as const;
