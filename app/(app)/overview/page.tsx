import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Sunrise } from "lucide-react";
import { redirect } from "next/navigation";

import { BriefingSummaryCard } from "@/components/briefing/BriefingSummaryCard";
import { EmptyState } from "@/components/EmptyState";
import { RelationshipCard } from "@/components/relationships/RelationshipCard";
import { briefings, db, relationships } from "@/lib/db";

function getTodayBounds() {
  const today = new Date().toISOString().slice(0, 10);

  return {
    today,
    start: new Date(`${today}T00:00:00.000Z`),
    end: new Date(`${today}T23:59:59.999Z`),
  };
}

export default async function OverviewPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { today, start, end } = getTodayBounds();

  const [relationshipRows, briefingRows] = await Promise.all([
    db
      .select({
        sourceCompany: relationships.sourceCompany,
        sourceTicker: relationships.sourceTicker,
        targetCompany: relationships.targetCompany,
        targetTicker: relationships.targetTicker,
        relationType: relationships.relationType,
        confidence: relationships.confidence,
        impactLevel: relationships.impactLevel,
        contextSnippet: relationships.contextSnippet,
        sourceUrl: relationships.sourceUrl,
      })
      .from(relationships)
      .where(
        and(
          eq(relationships.userId, userId),
          gte(relationships.extractedAt, start),
          lte(relationships.extractedAt, end),
        ),
      )
      .orderBy(desc(relationships.confidence)),
    db
      .select({
        summary: briefings.summary,
        itemsProcessed: briefings.itemsProcessed,
        relationshipsFound: briefings.relationshipsFound,
      })
      .from(briefings)
      .where(and(eq(briefings.userId, userId), eq(briefings.briefingDate, today)))
      .orderBy(desc(briefings.briefingDate))
      .limit(1),
  ]);

  const briefing = briefingRows[0] ?? null;
  const hasData = relationshipRows.length > 0 || briefing !== null;

  if (!hasData) {
    return (
      <EmptyState
        icon={Sunrise}
        message="No briefing yet today. Your morning briefing runs at 09:00 EEST."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="flex flex-col gap-4 lg:col-span-2">
        <h2 className="fr-heading text-base font-semibold text-zinc-100">
          Today&apos;s Relationships
        </h2>
        {relationshipRows.length > 0 ? (
          <div className="flex flex-col gap-4">
            {relationshipRows.map((relationship, index) => (
              <RelationshipCard
                key={`${relationship.sourceCompany}-${relationship.targetCompany}-${index}`}
                relationship={relationship}
              />
            ))}
          </div>
        ) : (
          <div className="fr-card p-6">
            <p className="text-sm text-zinc-400">
              No relationships extracted yet today.
            </p>
          </div>
        )}
      </section>

      <aside>
        <BriefingSummaryCard briefing={briefing} />
      </aside>
    </div>
  );
}