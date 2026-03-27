import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import { MODALITIES } from "@/lib/constants/modalities";
import { TalentMapClient } from "./talent-map-client";

interface TalentMapPageProps {
  searchParams: Promise<{
    modality?: string;
    level?: string;
  }>;
}

export default async function TalentMapPage({ searchParams }: TalentMapPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const modality = params.modality ?? "";
  const level = params.level ?? "";

  const supabase = await createClient();

  // Build athlete query with optional filters
  let athleteQuery = supabase.from("athletes").select("state, primary_modality, current_entity_id");

  if (modality) {
    athleteQuery = athleteQuery.eq("primary_modality", modality);
  }
  if (level) {
    athleteQuery = athleteQuery.eq("competitive_level", level);
  }

  const { data: athletes, error } = await athleteQuery;

  if (error) {
    console.error("Error fetching athlete map data:", error);
  }

  const athleteList = athletes ?? [];

  // Aggregate by state
  const stateData: Record<string, number> = {};
  const stateModalityMap: Record<string, Record<string, number>> = {};

  for (const athlete of athleteList) {
    if (!athlete.state) continue;
    const uf = athlete.state as string;
    stateData[uf] = (stateData[uf] ?? 0) + 1;

    if (athlete.primary_modality) {
      if (!stateModalityMap[uf]) stateModalityMap[uf] = {};
      stateModalityMap[uf][athlete.primary_modality] =
        (stateModalityMap[uf][athlete.primary_modality] ?? 0) + 1;
    }
  }

  const maxCount = Math.max(0, ...Object.values(stateData));
  const totalAthletes = athleteList.length;

  // Get entity counts per state
  const { data: entities } = await supabase.from("entities").select("state");
  const entityStateCount: Record<string, number> = {};
  for (const entity of entities ?? []) {
    if (!entity.state) continue;
    entityStateCount[entity.state] = (entityStateCount[entity.state] ?? 0) + 1;
  }

  // Build state details
  const stateDetails: Record<
    string,
    {
      uf: string;
      count: number;
      topModalities: { name: string; count: number }[];
      entityCount: number;
    }
  > = {};

  for (const [uf, count] of Object.entries(stateData)) {
    const modalityEntries = Object.entries(stateModalityMap[uf] ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, cnt]) => ({
        name: MODALITIES.find((m) => m.code === code)?.name ?? code,
        count: cnt,
      }));

    stateDetails[uf] = {
      uf,
      count,
      topModalities: modalityEntries,
      entityCount: entityStateCount[uf] ?? 0,
    };
  }

  return (
    <TalentMapClient
      stateData={stateData}
      maxCount={maxCount}
      stateDetails={stateDetails}
      totalAthletes={totalAthletes}
    />
  );
}
