"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const TOOL_LABELS: Record<string, (input: unknown) => string> = {
  get_watchlist: () => "Loading your watchlist…",
  query_relationships: (input) => {
    const params = input as { ticker?: string } | undefined;
    return params?.ticker
      ? `Looking up ${params.ticker} relationships…`
      : "Searching relationships…";
  },
  get_graph_stats: () => "Analyzing your graph…",
  search_news: (input) => {
    const params = input as { ticker?: string; query?: string } | undefined;
    if (params?.ticker) return `Searching news for ${params.ticker}…`;
    if (params?.query) return `Searching news for "${params.query}"…`;
    return "Searching news…";
  },
  get_briefing_history: () => "Loading briefing history…",
};

function getToolName(partType: string): string {
  return partType.startsWith("tool-") ? partType.slice(5) : partType;
}

function getToolLabel(toolName: string, input: unknown, isRunning: boolean): string {
  const label = TOOL_LABELS[toolName]?.(input) ?? `Running ${toolName.replaceAll("_", " ")}…`;
  return isRunning ? label : label.replace("…", " — done");
}

type ToolCallChipProps = {
  toolName: string;
  input: unknown;
  state: string;
  output?: unknown;
  errorText?: string;
};

export function ToolCallChip({
  toolName,
  input,
  state,
  output,
  errorText,
}: ToolCallChipProps) {
  const [open, setOpen] = useState(false);
  const isRunning =
    state === "input-streaming" ||
    state === "input-available" ||
    state === "approval-requested";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {isRunning ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-400" />
        ) : null}
        <span className="flex-1 text-zinc-300">
          {errorText ?? getToolLabel(toolName, input, isRunning)}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="border-t border-zinc-800 px-3 py-2 font-mono text-[11px] text-zinc-500">
          {errorText ? (
            <p className="text-rose-300/90">{errorText}</p>
          ) : output ? (
            <pre className="overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(output, null, 2)}
            </pre>
          ) : (
            <p>Waiting for tool result…</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

type ToolPart = {
  type: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

export function renderToolPart(part: ToolPart) {
  if (!part.type.startsWith("tool-") && part.type !== "dynamic-tool") {
    return null;
  }

  const toolName =
    part.type === "dynamic-tool"
      ? "tool"
      : getToolName(part.type);

  return (
    <ToolCallChip
      key={`${part.type}-${JSON.stringify(part.input)}`}
      toolName={toolName}
      input={part.input}
      state={part.state ?? "input-available"}
      output={part.output}
      errorText={part.errorText}
    />
  );
}