import { openai } from "@ai-sdk/openai";

export const models = {
  extraction: openai("gpt-4.1-mini"),
  briefing: openai("gpt-4.1-mini"),
  verification: openai("gpt-4.1-mini"),
} as const;
