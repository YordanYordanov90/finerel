import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BubbleProps = {
  children: ReactNode;
  variant: "user" | "assistant";
  className?: string;
};

export function Bubble({ children, variant, className }: BubbleProps) {
  return (
    <div
      className={cn(
        "max-w-[min(100%,42rem)] rounded-xl border px-4 py-3 text-sm leading-relaxed",
        variant === "user"
          ? "border-cyan-500/40 bg-cyan-500/10 text-zinc-100"
          : "border-zinc-800 bg-[#111111] text-zinc-100",
        className,
      )}
    >
      {children}
    </div>
  );
}