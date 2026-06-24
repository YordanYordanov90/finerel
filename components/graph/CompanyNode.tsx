"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import type { GraphNodeData } from "@/lib/data/graph";
import { cn } from "@/lib/utils";

type CompanyNodeType = Node<GraphNodeData, "company">;

export function CompanyNode({ data }: NodeProps<CompanyNodeType>) {
  const isWatchlist = data.isWatchlist;

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#111111] shadow-sm",
        isWatchlist
          ? "min-w-[160px] border-cyan-500/50 px-5 py-4"
          : "min-w-[130px] border-zinc-800 px-4 py-3",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-zinc-600 !bg-zinc-600"
      />
      <p
        className={cn(
          "font-sans font-medium text-zinc-100",
          isWatchlist ? "text-base" : "text-sm",
        )}
      >
        {data.name}
      </p>
      {data.ticker ? (
        <p className="mt-1 font-mono text-xs text-cyan-300/95">{data.ticker}</p>
      ) : null}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-zinc-600 !bg-zinc-600"
      />
    </div>
  );
}