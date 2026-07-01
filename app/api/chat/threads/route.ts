import { auth } from "@clerk/nextjs/server";

import { getOwnedThread, listThreads, loadMessages } from "@/lib/data/chat";

// Read-only thread helpers for the docked Ask panel (client-side). `?thread=`
// restores that thread's messages; without it, returns the full thread list for
// the /chat page switcher if needed. Scoped to the signed-in user.
export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const thread = url.searchParams.get("thread") ?? undefined;

  try {
    if (thread) {
      const owned = await getOwnedThread(userId, thread);
      const messages = owned ? await loadMessages(thread) : [];

      return Response.json({
        data: {
          threadId: owned ? thread : undefined,
          messages,
        },
      });
    }

    const threads = await listThreads(userId);

    return Response.json({
      data: { threads },
    });
  } catch (error) {
    console.error("[api/chat/threads] database error", {
      userId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
