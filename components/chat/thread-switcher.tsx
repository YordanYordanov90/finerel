"use client";

import { MessageSquarePlus } from "lucide-react";

import type { ChatThreadSummary } from "@/lib/data/chat";
import { cn } from "@/lib/utils";

type ThreadSwitcherProps = {
  threads: ChatThreadSummary[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
};

function formatThreadTitle(thread: ChatThreadSummary): string {
  return thread.title?.trim() || "New conversation";
}

export function ThreadSwitcher({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
}: ThreadSwitcherProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-[#111111]">
      <div className="border-b border-zinc-800 p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-md border border-zinc-800 bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-cyan-300"
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          New chat
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <p className="px-2 py-3 text-xs text-zinc-500">No conversations yet.</p>
        ) : (
          <ul className="space-y-1">
            {threads.map((thread) => {
              const active = thread.id === activeThreadId;

              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => onSelectThread(thread.id)}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-cyan-500/10 text-cyan-300"
                        : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200",
                    )}
                  >
                    <span className="line-clamp-2">{formatThreadTitle(thread)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}