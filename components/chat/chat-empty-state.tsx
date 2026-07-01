"use client";

import { MessageSquare } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "What changed for NVDA this week?",
  "Which company is most connected?",
  "What did you tell me in my last briefing?",
  "Show me high-confidence partnerships this month",
] as const;

type ChatEmptyStateProps = {
  onSelectPrompt: (prompt: string) => void;
};

export function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <MessageSquare className="h-8 w-8 text-zinc-600" aria-hidden="true" />
      <div className="max-w-md space-y-2">
        <h2 className="fr-heading text-lg font-semibold text-zinc-100">
          Watchlist Agent
        </h2>
        <p className="text-sm text-zinc-400">
          Ask about your watchlist, relationships, news, and briefing history.
          Answers are grounded in your stored data.
        </p>
      </div>
      <div className="flex w-full max-w-lg flex-wrap justify-center gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="rounded-xl border border-zinc-800 bg-[#111111] px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-zinc-100"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}