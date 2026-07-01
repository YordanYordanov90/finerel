"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, generateId, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatMessageRow } from "@/components/chat/chat-message";
import { ChatPromptInput } from "@/components/chat/chat-prompt-input";
import { MessageScroller } from "@/components/chat/message-scroller";
import { ThreadSwitcher } from "@/components/chat/thread-switcher";
import type { PageChatContext } from "@/lib/chat/page-context";
import type { ChatThreadSummary } from "@/lib/data/chat";
import { cn } from "@/lib/utils";

type ChatSurfaceProps = {
  threads?: ChatThreadSummary[];
  initialThreadId?: string;
  initialMessages?: UIMessage[];
  // "page" (default) renders the full-page shell with the thread switcher.
  // "panel" fills its parent (the Ask Sheet) and hides the switcher.
  layout?: "page" | "panel";
  // Called after a turn is sent on the full-page layout (refreshes thread list).
  onAfterSend?: () => void;
  // Sent with each turn so the agent can interpret references to the current
  // view. Panel only; the page sends none.
  pageContext?: PageChatContext | null;
};

function getAssistantText(message: UIMessage | undefined): string {
  if (!message || message.role !== "assistant") return "";
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function ChatSurface({
  threads = [],
  initialThreadId,
  initialMessages = [],
  layout = "page",
  onAfterSend,
  pageContext,
}: ChatSurfaceProps) {
  const router = useRouter();
  const [threadId] = useState(() => initialThreadId ?? generateId());
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest({ messages, id, body }) {
          const lastMessage = messages.at(-1);
          if (!lastMessage || lastMessage.role !== "user") {
            return { body: { threadId: id } };
          }

          // `body` carries per-call extras (e.g. page context) passed to
          // sendMessage; merge them into the request.
          return {
            body: {
              threadId: id,
              message: lastMessage,
              ...body,
            },
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error, regenerate, clearError } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: () => {
      // Error UI handled below; keep hook state in sync.
    },
  });

  const isBusy = status === "submitted" || status === "streaming";
  const lastMessage = messages.at(-1);
  const showTypingIndicator =
    status === "submitted" ||
    (status === "streaming" &&
      lastMessage?.role === "assistant" &&
      getAssistantText(lastMessage).length === 0 &&
      !lastMessage.parts.some((part) => part.type.startsWith("tool-")));

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isBusy) return;

    setInput("");
    clearError();
    await sendMessage(
      { text },
      pageContext ? { body: { context: pageContext } } : undefined,
    );

    if (layout === "page") {
      if (onAfterSend) {
        onAfterSend();
      } else {
        router.refresh();
      }
    }
  }, [
    clearError,
    input,
    isBusy,
    layout,
    onAfterSend,
    pageContext,
    router,
    sendMessage,
  ]);

  const handleSelectPrompt = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  const handleSelectThread = useCallback(
    (selectedThreadId: string) => {
      router.push(`/chat?thread=${selectedThreadId}`);
    },
    [router],
  );

  const handleNewChat = useCallback(() => {
    router.push(`/chat?thread=${generateId()}`);
  }, [router]);

  const handleRetry = useCallback(() => {
    clearError();
    void regenerate();
  }, [clearError, regenerate]);

  return (
    <div
      className={cn(
        "flex overflow-hidden",
        layout === "panel"
          ? "min-h-0 flex-1"
          : "-m-4 h-[calc(100dvh-3.5rem)] md:-m-6",
      )}
    >
      {layout === "page" ? (
        <ThreadSwitcher
          threads={threads}
          activeThreadId={threadId}
          onSelectThread={handleSelectThread}
          onNewChat={handleNewChat}
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MessageScroller>
          {messages.length === 0 && !error ? (
            <ChatEmptyState onSelectPrompt={handleSelectPrompt} />
          ) : null}

          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            const isStreamingAssistant =
              isLast && message.role === "assistant" && status === "streaming";

            return (
              <ChatMessageRow
                key={message.id}
                message={message}
                isStreaming={isStreamingAssistant}
                showTypingIndicator={
                  isLast && message.role === "assistant" && showTypingIndicator
                }
              />
            );
          })}

          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <p>Something went wrong. The agent couldn&apos;t complete that turn.</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 font-medium text-rose-100 underline underline-offset-2 hover:text-white"
              >
                Try again
              </button>
            </div>
          ) : null}
        </MessageScroller>

        <ChatPromptInput
          value={input}
          onChange={setInput}
          onSubmit={() => void handleSubmit()}
          disabled={isBusy}
          isStreaming={isBusy}
        />
      </div>
    </div>
  );
}