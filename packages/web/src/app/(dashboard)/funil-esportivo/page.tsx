import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import { FunnelClient } from "./funnel-client";

interface FunnelPageProps {
  searchParams: Promise<{
    modality?: string;
    state?: string;
  }>;
}

export default async function FunnelPage({ searchParams }: FunnelPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const modality = params.modality ?? "";
  const state = params.state ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("athletes")
    .select("competitive_level");

  if (modality) {
    query = query.eq("primary_modality", modality);
  }
  if (state) {
    query = query.eq("state", state);
  }

  const { data: athletes, error } = await query;

  if (error) {
    console.error("Error fetching funnel data:", error);
  }

  const athleteList = athletes ?? [];
  const totalAthletes = athleteList.length;

  // Aggregate by competitive_level
  const levelCounts: Record<string, number> = {
    school: 0,
    state: 0,
    national: 0,
    elite: 0,
  };

  for (const athlete of athleteList) {
    if (athlete.competitive_level && athlete.competitive_level in levelCounts) {
      levelCounts[athlete.competitive_level]++;
    }
  }

  const funnelData = Object.entries(levelCounts).map(([level, count]) => ({
    level,
    count,
  }));

  return (
    <FunnelClient
      funnelData={funnelData}
      totalAthletes={totalAthletes}
    />
  );
}
