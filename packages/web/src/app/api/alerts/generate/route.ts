import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import type { AlertType, AlertSeverity } from "@/types/database";

// ── Types ──────────────────────────────────────────────────────────────────────

interface NewAlert {
  athlete_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  description: string;
  data: Record<string, unknown>;
  is_read: boolean;
}

interface ResultRow {
  athlete_id: string;
  competition_id: string;
  mark_numeric: number | null;
  created_at: string;
}

interface AthleteRow {
  id: string;
  full_name: string;
  competitive_level: string;
  primary_modality: string;
}

// ── POST /api/alerts/generate ──────────────────────────────────────────────────

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const newAlerts: NewAlert[] = [];

    // ── Fetch existing unread alerts to avoid duplicates ─────────────────────
    const { data: existingAlerts } = await supabase
      .from("scouting_alerts")
      .select("athlete_id, alert_type")
      .eq("is_read", false);

    const existingSet = new Set<string>(
      (existingAlerts ?? []).map(
        (a: { athlete_id: string; alert_type: string }) =>
          `${a.athlete_id}:${a.alert_type}`
      )
    );

    function isDuplicate(athleteId: string, alertType: AlertType): boolean {
      return existingSet.has(`${athleteId}:${alertType}`);
    }

    // ── 1. progression_spike ─────────────────────────────────────────────────
    // Athletes whose latest mark_numeric is >20% better than their previous mark
    // in the same modality (via competition).
    {
      // Get all results with numeric marks, ordered by created_at
      const { data: results } = await supabase
        .from("results")
        .select(
          `
          athlete_id,
          competition_id,
          mark_numeric,
          created_at,
          competitions (
            modality_code
          )
        `
        )
        .not("mark_numeric", "is", null)
        .order("created_at", { ascending: true });

      if (results) {
        // Group by athlete_id + modality_code → list of (mark_numeric, date)
        const athleteModalityMap = new Map<
          string,
          { marks: number[]; latestMark: number }
        >();

        for (const row of results as unknown as Array<
          ResultRow & { competitions: { modality_code: string } | null }
        >) {
          if (!row.mark_numeric || !row.competitions?.modality_code) continue;

          const key = `${row.athlete_id}:${row.competitions.modality_code}`;
          const existing = athleteModalityMap.get(key);
          if (!existing) {
            athleteModalityMap.set(key, {
              marks: [row.mark_numeric],
              latestMark: row.mark_numeric,
            });
          } else {
            existing.marks.push(row.mark_numeric);
            existing.latestMark = row.mark_numeric;
          }
        }

        for (const [key, data] of athleteModalityMap) {
          if (data.marks.length < 2) continue;
          const [athleteId] = key.split(":");
          const previousMark = data.marks[data.marks.length - 2];
          const latestMark = data.marks[data.marks.length - 1];
          // Higher mark = better (simplified; works for most track & field)
          const improvement = (latestMark - previousMark) / Math.abs(previousMark);

          if (improvement > 0.2 && !isDuplicate(athleteId, "progression_spike")) {
            newAlerts.push({
              athlete_id: athleteId,
              alert_type: "progression_spike",
              severity: improvement > 0.4 ? "high" : "medium",
              description: `Atleta apresentou progressão de ${(improvement * 100).toFixed(1)}% no resultado mais recente em relação ao anterior.`,
              data: {
                previous_mark: previousMark,
                latest_mark: latestMark,
                improvement_pct: improvement,
              },
              is_read: false,
            });
          }
        }
      }
    }

    // ── 2. dropout_risk ──────────────────────────────────────────────────────
    // Athletes with level >= 'state' who have no results in the last 6 months.
    {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const cutoff = sixMonthsAgo.toISOString();

      // Get athletes at state/national/elite level
      const { data: athletes } = await supabase
        .from("athletes")
        .select("id, full_name, competitive_level, primary_modality")
        .in("competitive_level", ["state", "national", "elite"])
        .eq("status", "active");

      if (athletes) {
        // Get athlete IDs that have results in the last 6 months
        const { data: recentResults } = await supabase
          .from("results")
          .select("athlete_id")
          .gte("created_at", cutoff);

        const activeAthleteIds = new Set<string>(
          (recentResults ?? []).map((r: { athlete_id: string }) => r.athlete_id)
        );

        for (const athlete of athletes as unknown as AthleteRow[]) {
          if (
            !activeAthleteIds.has(athlete.id) &&
            !isDuplicate(athlete.id, "dropout_risk")
          ) {
            const levelSeverity: Record<string, AlertSeverity> = {
              state: "medium",
              national: "high",
              elite: "high",
            };
            newAlerts.push({
              athlete_id: athlete.id,
              alert_type: "dropout_risk",
              severity: levelSeverity[athlete.competitive_level] ?? "medium",
              description: `Atleta de nível ${athlete.competitive_level} sem resultados registrados nos últimos 6 meses. Possível risco de abandono.`,
              data: {
                competitive_level: athlete.competitive_level,
                cutoff_date: cutoff,
              },
              is_read: false,
            });
          }
        }
      }
    }

    // ── 3. talent_detected ───────────────────────────────────────────────────
    // School-level athletes whose mark_numeric is in the top 10% for their modality.
    {
      // Get all results for school-level athletes
      const { data: schoolResults } = await supabase
        .from("results")
        .select(
          `
          athlete_id,
          mark_numeric,
          competitions (
            modality_code
          ),
          athletes (
            id,
            competitive_level
          )
        `
        )
        .not("mark_numeric", "is", null);

      if (schoolResults) {
        // Group results by modality → all marks + school athlete marks
        const modalityMarks = new Map<string, number[]>();
        const schoolAthleteResults = new Map<
          string,
          { athleteId: string; modality: string; bestMark: number }
        >();

        for (const row of schoolResults as unknown as Array<{
          athlete_id: string;
          mark_numeric: number | null;
          competitions: { modality_code: string } | null;
          athletes: { id: string; competitive_level: string } | null;
        }>) {
          if (!row.mark_numeric || !row.competitions?.modality_code || !row.athletes) continue;
          const modality = row.competitions.modality_code;

          // Collect all marks per modality for percentile calculation
          const existing = modalityMarks.get(modality) ?? [];
          existing.push(row.mark_numeric);
          modalityMarks.set(modality, existing);

          // Track best mark per school-level athlete per modality
          if (row.athletes.competitive_level === "school") {
            const key = `${row.athlete_id}:${modality}`;
            const current = schoolAthleteResults.get(key);
            if (!current || row.mark_numeric > current.bestMark) {
              schoolAthleteResults.set(key, {
                athleteId: row.athlete_id,
                modality,
                bestMark: row.mark_numeric,
              });
            }
          }
        }

        // Determine 90th percentile per modality
        for (const [, data] of schoolAthleteResults) {
          const { athleteId, modality, bestMark } = data;
          const allMarks = modalityMarks.get(modality) ?? [];
          if (allMarks.length < 5) continue; // Need enough data

          const sorted = [...allMarks].sort((a, b) => a - b);
          const p90Index = Math.floor(sorted.length * 0.9);
          const p90Value = sorted[p90Index];

          if (bestMark >= p90Value && !isDuplicate(athleteId, "talent_detected")) {
            newAlerts.push({
              athlete_id: athleteId,
              alert_type: "talent_detected",
              severity: "high",
              description: `Atleta de nível escolar com resultado no top 10% da modalidade (${bestMark.toFixed(2)} vs. p90: ${p90Value.toFixed(2)}).`,
              data: {
                best_mark: bestMark,
                p90_value: p90Value,
                modality,
              },
              is_read: false,
            });
          }
        }
      }
    }

    // ── Insert new alerts ────────────────────────────────────────────────────
    let insertedCount = 0;

    if (newAlerts.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("scouting_alerts")
        .insert(newAlerts)
        .select("id");

      if (insertError) {
        console.error("Error inserting alerts:", insertError);
        return NextResponse.json(
          { error: "Erro ao inserir alertas" },
          { status: 500 }
        );
      }

      insertedCount = inserted?.length ?? 0;
    }

    return NextResponse.json({ count: insertedCount });
  } catch (err) {
    console.error("Error in /api/alerts/generate:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
