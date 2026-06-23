import { Receiver } from "@upstash/qstash";

import { env } from "./env";

const receiver = new Receiver({
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

export type QStashVerificationResult =
  | { valid: true; body: string }
  | { valid: false };

export async function verifyQStashRequest(
  request: Request,
): Promise<QStashVerificationResult> {
  const signature = request.headers.get("upstash-signature");

  if (!signature) {
    return { valid: false };
  }

  const body = await request.text();

  try {
    await receiver.verify({
      signature,
      body,
      url: request.url,
    });
    return { valid: true, body };
  } catch {
    return { valid: false };
  }
}