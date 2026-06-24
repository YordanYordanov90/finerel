import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BriefingTable } from "@/components/history/BriefingTable";

export default async function HistoryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <BriefingTable />;
}