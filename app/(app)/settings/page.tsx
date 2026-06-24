import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { BriefingTimeSection } from "@/components/settings/BriefingTimeSection";
import { isDemoUser } from "@/lib/auth";
import { db, users } from "@/lib/db";

function getPrimaryEmail(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
): string {
  const primary = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId,
  );

  return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "—";
}

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [clerkUser, dbUser] = await Promise.all([
    currentUser(),
    db
      .select({ briefingTime: users.briefingTime })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  const readOnly = isDemoUser(userId);
  const email = clerkUser ? getPrimaryEmail(clerkUser) : "—";
  const briefingTime = dbUser?.briefingTime ?? "09:00";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="fr-heading text-xl font-semibold text-zinc-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Account preferences for your morning briefing.
        </p>
      </div>

      {readOnly ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          Demo account — settings are read-only.
        </p>
      ) : null}

      <section className="fr-card p-6">
        <h2 className="text-sm font-medium text-zinc-400">Email address</h2>
        <p className="mt-3 text-base text-zinc-100">{email}</p>
        <p className="mt-2 text-xs text-zinc-400">
          Managed via your Clerk account — not editable here.
        </p>
      </section>

      <BriefingTimeSection briefingTime={briefingTime} readOnly={readOnly} />
    </div>
  );
}