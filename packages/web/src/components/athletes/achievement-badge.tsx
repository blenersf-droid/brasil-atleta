import { Trophy, Medal, Award, Zap } from "lucide-react";

export type AchievementType = "gold" | "silver" | "bronze" | "participation" | "record";

export interface AchievementBadgeProps {
  title: string;
  competition_name?: string | null;
  date?: string | null;
  type: AchievementType;
  description?: string | null;
  compact?: boolean;
}

const badgeStyles: Record<
  AchievementType,
  { bg: string; border: string; iconColor: string; label: string }
> = {
  gold: {
    bg: "bg-gradient-to-br from-amber-400/20 to-yellow-500/10",
    border: "border-amber-400/40",
    iconColor: "text-amber-500",
    label: "Ouro",
  },
  silver: {
    bg: "bg-gradient-to-br from-gray-300/20 to-slate-400/10",
    border: "border-gray-300/50",
    iconColor: "text-gray-400",
    label: "Prata",
  },
  bronze: {
    bg: "bg-gradient-to-br from-orange-400/20 to-orange-600/10",
    border: "border-orange-400/40",
    iconColor: "text-orange-500",
    label: "Bronze",
  },
  participation: {
    bg: "bg-gradient-to-br from-blue-400/15 to-blue-600/10",
    border: "border-blue-400/30",
    iconColor: "text-blue-500",
    label: "Participacao",
  },
  record: {
    bg: "bg-gradient-to-br from-emerald-400/20 to-green-600/10",
    border: "border-emerald-400/40",
    iconColor: "text-emerald-500",
    label: "Recorde",
  },
};

function AchievementIcon({
  type,
  className,
}: {
  type: AchievementType;
  className?: string;
}) {
  if (type === "gold" || type === "silver" || type === "bronze") {
    return <Medal className={className} />;
  }
  if (type === "record") {
    return <Zap className={className} />;
  }
  if (type === "participation") {
    return <Award className={className} />;
  }
  return <Trophy className={className} />;
}

export function AchievementBadge({
  title,
  competition_name,
  date,
  type,
  description,
  compact = false,
}: AchievementBadgeProps) {
  const styles = badgeStyles[type] ?? badgeStyles.participation;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border p-2.5 ${styles.bg} ${styles.border}`}
        title={description ?? title}
      >
        <AchievementIcon type={type} className={`size-5 shrink-0 ${styles.iconColor}`} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#0a1628] truncate">{title}</p>
          {competition_name && (
            <p className="text-[10px] text-[#0a1628]/50 truncate">{competition_name}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border p-4 ${styles.bg} ${styles.border} transition-all hover:scale-[1.02]`}
    >
      {/* Icon + type badge */}
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${styles.border} bg-white/60`}
        >
          <AchievementIcon type={type} className={`size-5 ${styles.iconColor}`} />
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles.iconColor} bg-white/60 border ${styles.border}`}
        >
          {styles.label}
        </span>
      </div>

      {/* Title */}
      <div>
        <p className="font-bold text-[#0a1628] text-sm leading-tight">{title}</p>
        {competition_name && (
          <p className="text-xs text-[#0a1628]/60 mt-0.5">{competition_name}</p>
        )}
        {description && (
          <p className="text-xs text-[#0a1628]/40 mt-1 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Date */}
      {date && (
        <p className="text-[10px] text-[#0a1628]/35 font-mono mt-auto pt-1 border-t border-[#0a1628]/[0.06]">
          {date}
        </p>
      )}
    </div>
  );
}
