import { FileText } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";

export type BriefingSummaryData = {
  summary: string;
  itemsProcessed: number;
  relationshipsFound: number;
};

export function BriefingSummaryCard({
  briefing,
}: {
  briefing: BriefingSummaryData | null;
}) {
  if (!briefing) {
    return (
      <EmptyState
        icon={FileText}
        message="No briefing yet today. Your morning briefing runs at 09:00 EEST."
      />
    );
  }

  const summary =
    briefing.summary.length > 500
      ? `${briefing.summary.slice(0, 500)}…`
      : briefing.summary;

  return (
    <article className="fr-card flex flex-col gap-4 p-5">
      <h2 className="fr-heading text-base font-semibold text-zinc-100">
        Today&apos;s Briefing
      </h2>
      <p className="text-sm leading-relaxed text-zinc-400">{summary}</p>
      <div className="flex flex-wrap gap-2">
        <span className="fr-badge">{briefing.itemsProcessed} items processed</span>
        <span className="fr-badge">
          {briefing.relationshipsFound} relationships found
        </span>
      </div>
    </article>
  );
}