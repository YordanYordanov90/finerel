"use client";

import { generateId, type UIMessage } from "ai";
import { Maximize2, MessageCircle, Sparkles, SquarePen, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ChatSurface } from "@/components/chat/chat-surface";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { derivePageContext } from "@/lib/chat/page-context";
import type { ChatThreadSummary } from "@/lib/data/chat";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "finerel:ask:last-thread";

type AskChatContextValue = { open: () => void };

const AskChatContext = createContext<AskChatContextValue | null>(null);

// Returns null outside the provider (e.g. the demo shell) so the launcher can
// safely render nothing there.
export function useAskChat(): AskChatContextValue | null {
  return useContext(AskChatContext);
}

export function AskChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const value = useMemo<AskChatContextValue>(() => ({ open: () => setOpen(true) }), []);

  // The /chat page already is the full chat surface, so the floating launcher
  // is redundant there.
  const onChatPage = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <AskChatContext.Provider value={value}>
      {children}
      <FloatingAskButton hidden={open || onChatPage} onClick={() => setOpen(true)} />
      <AskPanel open={open} onOpenChange={setOpen} />
    </AskChatContext.Provider>
  );
}

// Bottom-right floating launcher: a chat bubble with a gentle idle float and an
// attention pulse ring. Collapses out of the way while the panel is open.
function FloatingAskButton({
  hidden,
  onClick,
}: {
  hidden: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 transition-all duration-200",
        hidden
          ? "pointer-events-none scale-0 opacity-0"
          : "scale-100 opacity-100",
      )}
    >
      <div className="fr-ask-float">
        <button
          type="button"
          onClick={onClick}
          aria-label="Ask Finerel"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/30 transition-transform duration-200 hover:scale-110 hover:bg-cyan-400 hover:shadow-cyan-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
        >
          <span
            aria-hidden
            className="fr-ask-pulse pointer-events-none absolute inset-0 rounded-full bg-cyan-500/50"
          />
          <MessageCircle className="relative h-6 w-6" />
          <span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-md border border-zinc-800 bg-[#111111] px-2.5 py-1 text-xs font-medium text-zinc-200 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
            Ask Finerel
          </span>
        </button>
      </div>
    </div>
  );
}

type AskPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function AskPanel({ open, onOpenChange }: AskPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pageContext = useMemo(() => derivePageContext(pathname), [pathname]);

  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [ready, setReady] = useState(false);

  const refreshThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/threads");
      if (!res.ok) return;
      const { data } = await res.json();
      setThreads(data.threads ?? []);
    } catch {
      // Non-fatal — the thread list just won't update this turn.
    }
  }, []);

  // First open: restore the last conversation, or start a fresh thread.
  useEffect(() => {
    if (!open || ready) return;

    let cancelled = false;
    const last =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;

    (async () => {
      let data: {
        threads?: ChatThreadSummary[];
        threadId?: string;
        messages?: UIMessage[];
      } = {};

      try {
        const url = last
          ? `/api/chat/threads?thread=${encodeURIComponent(last)}`
          : "/api/chat/threads";
        const res = await fetch(url);
        if (res.ok) {
          ({ data } = await res.json());
        }
      } catch {
        // Fall through to a fresh thread.
      }

      if (cancelled) return;

      setThreads(data.threads ?? []);

      if (last && data.threadId === last && (data.messages?.length ?? 0) > 0) {
        setActiveThreadId(last);
        setInitialMessages(data.messages ?? []);
      } else {
        if (last) window.localStorage.removeItem(STORAGE_KEY);
        setActiveThreadId(generateId());
        setInitialMessages([]);
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, ready]);

  // Persist the active thread so reopening restores it.
  useEffect(() => {
    if (activeThreadId && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, activeThreadId);
    }
  }, [activeThreadId]);

  const handleNewChat = useCallback(() => {
    setActiveThreadId(generateId());
    setInitialMessages([]);
  }, []);

  const handleAfterSend = useCallback(() => {
    void refreshThreads();
  }, [refreshThreads]);

  const handleExpand = useCallback(() => {
    if (activeThreadId) {
      router.push(`/chat?thread=${activeThreadId}`);
    }
    onOpenChange(false);
  }, [activeThreadId, onOpenChange, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 border-zinc-800 bg-[#0a0a0a] p-0 sm:max-w-xl"
      >
        <SheetHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b border-zinc-800 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <SheetTitle className="text-sm text-zinc-100">Ask Finerel</SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Chat with the Finerel Watchlist Agent about your portfolio.
          </SheetDescription>
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              type="button"
              onClick={handleNewChat}
              title="New chat"
              aria-label="New chat"
              className="rounded-md p-1.5 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <SquarePen className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleExpand}
              title="Open in full page"
              aria-label="Open in full page"
              className="rounded-md p-1.5 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              title="Close"
              aria-label="Close"
              className="rounded-md p-1.5 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        {ready && activeThreadId ? (
          <ChatSurface
            key={activeThreadId}
            layout="panel"
            threads={threads}
            initialThreadId={activeThreadId}
            initialMessages={initialMessages}
            onAfterSend={handleAfterSend}
            pageContext={pageContext}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Loading…
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
