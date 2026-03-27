"use client";

import { Trophy } from "lucide-react";
import {
  AchievementBadge,
  type AchievementType,
} from "@/components/athletes/achievement-badge";
import { AddAchievementDialog } from "./add-achievement-dialog";

interface Achievement {
  id: string;
  title: string;
  competition_name?: string | null;
  date?: string | null;
  type: AchievementType;
  description?: string | null;
}

interface AchievementsSectionProps {
  athleteId: string;
  achievements: Achievement[];
}

export function AchievementsSection({
  athleteId,
  achievements,
}: AchievementsSectionProps) {
  const sorted = [...achievements].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#0a1628]">Conquistas e Titulos</h2>
          <p className="text-xs text-[#0a1628]/40 mt-0.5">
            Seus melhores momentos no esporte
          </p>
        </div>
        <AddAchievementDialog athleteId={athleteId} />
      </div>

      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              title={achievement.title}
              competition_name={achievement.competition_name}
              date={achievement.date}
              type={achievement.type}
              description={achievement.description}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-[#0a1628]/[0.1] bg-[#0a1628]/[0.01]">
          <Trophy className="size-10 text-amber-400/40 mb-3" />
          <p className="text-sm font-medium text-[#0a1628]/50">
            Registre sua primeira conquista!
          </p>
          <p className="text-xs text-[#0a1628]/30 mt-1 max-w-xs">
            Scouts buscam atletas com historico comprovado. Cada medalha conta.
          </p>
          <div className="mt-4">
            <AddAchievementDialog athleteId={athleteId} triggerLabel="Registrar primeira conquista" />
          </div>
        </div>
      )}
    </div>
  );
}
