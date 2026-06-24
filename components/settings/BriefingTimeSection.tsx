"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const HOUR_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00",
];

type BriefingTimeSectionProps = {
  briefingTime: string;
  readOnly: boolean;
};

export function BriefingTimeSection({
  briefingTime,
  readOnly,
}: BriefingTimeSectionProps) {
  const [selected, setSelected] = useState(briefingTime);
  const [saving, setSaving] = useState(false);

  const isDirty = selected !== briefingTime;

  async function handleSave() {
    if (saving || readOnly) return;

    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefingTime: selected }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }

      toast.success("Briefing time updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="fr-card p-6">
      <h2 className="text-sm font-medium text-zinc-400">Briefing time</h2>
      <div className="mt-3 flex items-center gap-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={readOnly || saving}
          className="rounded-md border border-zinc-800 bg-[#111111] px-3 py-1.5 font-mono text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {HOUR_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t} EEST
            </option>
          ))}
        </select>
        {!readOnly && (
          <Button
            type="button"
            disabled={!isDirty || saving}
            onClick={() => void handleSave()}
            className="fr-cta-btn h-8 border-0 px-4 text-sm"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        Your morning briefing email will be sent at this time (EEST / UTC+3).
      </p>
    </section>
  );
}
