import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
  FINNHUB_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => issue.path[0])
      .filter((name): name is string => typeof name === "string");

    const uniqueMissing = [...new Set(missing)];

    throw new Error(
      `Missing required environment variable(s): ${uniqueMissing.join(", ")}`,
    );
  }

  return result.data;
}

export const env = parseEnv();