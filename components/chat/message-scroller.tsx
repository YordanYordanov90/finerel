"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type MessageScrollerProps = {
  children: ReactNode;
  className?: string;
};

export function MessageScroller({ children, className }: MessageScrollerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        {children}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  );
}