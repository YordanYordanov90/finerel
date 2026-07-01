import { auth } from "@clerk/nextjs/server";
import type { UIMessage } from "ai";
import { redirect } from "next/navigation";

import { ChatSurface } from "@/components/chat/chat-surface";
import { listThreads, loadMessages } from "@/lib/data/chat";

type ChatPageProps = {
  searchParams: Promise<{ thread?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { thread } = await searchParams;
  const threads = await listThreads(userId);

  let initialMessages: UIMessage[] = [];
  let initialThreadId: string | undefined;

  if (thread) {
    const isKnownThread = threads.some((entry) => entry.id === thread);

    if (isKnownThread) {
      initialMessages = await loadMessages(thread);
      initialThreadId = thread;
    } else {
      initialThreadId = thread;
    }
  }

  return (
    <ChatSurface
      key={initialThreadId ?? "new"}
      threads={threads}
      initialThreadId={initialThreadId}
      initialMessages={initialMessages}
    />
  );
}