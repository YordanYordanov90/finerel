"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

const TICKER_PATTERN = /\b([A-Z]{1,5}(?:\.[A-Z])?)\b/g;

function renderTextWithTickers(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TICKER_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const ticker = match[1];
    nodes.push(
      <span
        key={`${match.index}-${ticker}`}
        className="mx-0.5 inline-flex font-mono rounded-md border border-zinc-800 bg-black/55 px-1.5 py-0.5 text-xs text-cyan-300/95"
      >
        {ticker}
      </span>,
    );

    lastIndex = match.index + ticker.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "prose prose-invert max-w-none prose-p:my-2 prose-headings:fr-heading prose-headings:text-zinc-100 prose-a:text-cyan-300 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-100 prose-li:my-1 prose-ul:my-2 prose-ol:my-2",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p>{typeof children === "string" ? renderTextWithTickers(children) : children}</p>
          ),
          li: ({ children }) => (
            <li>{typeof children === "string" ? renderTextWithTickers(children) : children}</li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}