"use client";

import { useReactFlow } from "@xyflow/react";
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

type GraphControlsProps = {
  onResetLayout: () => void;
};

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
    >
      {children}
    </button>
  );
}

export function GraphControls({ onResetLayout }: GraphControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-0.5 rounded-xl border border-zinc-800 bg-[#111111]/80 p-1 backdrop-blur">
      <ControlButton label="Zoom in" onClick={() => zoomIn({ duration: 200 })}>
        <ZoomIn className="h-4 w-4" />
      </ControlButton>
      <ControlButton label="Zoom out" onClick={() => zoomOut({ duration: 200 })}>
        <ZoomOut className="h-4 w-4" />
      </ControlButton>
      <ControlButton
        label="Fit view"
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
      >
        <Maximize2 className="h-4 w-4" />
      </ControlButton>
      <ControlButton label="Reset layout" onClick={onResetLayout}>
        <RotateCcw className="h-4 w-4" />
      </ControlButton>
    </div>
  );
}