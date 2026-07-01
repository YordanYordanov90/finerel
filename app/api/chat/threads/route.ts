import { auth } from "@clerk/nextjs/server";

import { ChatAccessError, listThreads, loadThreadMessages } from "@/lib/data/chat";

// Read-only thread listing for the docked Ask panel, which is client-side and
// can't use the server-component load path the /chat page uses. With `?thread=`
// it also returns that thread's messages so the panel can restore the last
// conversation. Scoped to the signed-in user.
export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const thread = url.searchParams.get("thread") ?? undefined;

  try {
    const threads = await listThreads(userId);
    const isKnownThread = thread
      ? threads.some((entry) => entry.id === thread)
      : false;

    const messages =
      thread && isKnownThread
        ? await loadThreadMessages(userId, thread)
        : [];

    return Response.json({
      data: {
        threads,
        threadId: isKnownThread ? thread : undefined,
        messages,
      },
    });
  } catch (error) {
    if (error instanceof ChatAccessError) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("[api/chat/threads] database error", {
      userId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
