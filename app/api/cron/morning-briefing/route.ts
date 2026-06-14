import { verifyQStashRequest } from "@/lib/agent/verify-qstash";

export async function POST(request: Request) {
  const verification = await verifyQStashRequest(request);

  if (!verification.valid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[morning-briefing] received", {
    timestamp: new Date().toISOString(),
  });

  return Response.json({ ok: true });
}