"use client";

import { ArrowUp, Loader2 } from "lucide-react";
import { useCallback, useRef, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatPromptInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
};

export function ChatPromptInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isStreaming = false,
}: ChatPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!disabled && value.trim()) {
          onSubmit();
        }
      }
    },
    [disabled, onSubmit, value],
  );

  return (
    <div className="border-t border-zinc-800 bg-[#0a0a0a]/90 px-4 py-4 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your watchlist…"
          disabled={disabled}
          rows={1}
          className="min-h-11 max-h-40 resize-none border-zinc-800 bg-[#111111] text-zinc-100 placeholder:text-zinc-500 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
        />
        <Button
          type="button"
          size="icon"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="h-11 w-11 shrink-0 rounded-lg bg-cyan-500 text-zinc-950 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-500"
          aria-label="Send message"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}