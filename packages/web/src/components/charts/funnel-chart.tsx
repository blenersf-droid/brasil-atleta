"use client";

import { cn } from "@/lib/utils";

export interface FunnelLevel {
  label: string;
  count: number;
  color: string;
  sublabel?: string;
}

export interface FunnelChartProps {
  levels: FunnelLevel[];
  className?: string;
}

const WIDTH_RATIOS = [1, 0.7, 0.4, 0.15];

export function FunnelChart({ levels, className }: FunnelChartProps) {
  const totalCount = levels[0]?.count ?? 0;

  return (
    <div className={cn("flex flex-col items-center gap-0 w-full", className)}>
      {levels.map((level, i) => {
        const widthRatio = WIDTH_RATIOS[i] ?? 0.15;
        const pct = totalCount > 0 ? Math.round((level.count / totalCount) * 100) : 0;
        const nextLevel = levels[i + 1];
        const conversionRate =
          nextLevel && level.count > 0
            ? Math.round((nextLevel.count / level.count) * 100)
            : null;

        return (
          <div key={level.label} className="flex w-full flex-col items-center">
            {/* Funnel bar */}
            <div
              className="flex items-center justify-between gap-4 rounded-xl px-5 py-4 transition-all duration-500"
              style={{
                width: `${widthRatio * 100}%`,
                backgroundColor: level.color,
                minWidth: "160px",
              }}
            >
              {/* Left: label */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className={cn(
                    "text-sm font-semibold leading-tight truncate",
                    i >= 2 ? "text-white" : "text-foreground"
                  )}
                >
                  {level.label}
                </span>
                {level.sublabel && (
                  <span
                    className={cn(
                      "text-xs opacity-75",
                      i >= 2 ? "text-white" : "text-muted-foreground"
                    )}
                  >
                    {level.sublabel}
                  </span>
                )}
              </div>

              {/* Right: count + pct */}
              <div className="flex flex-col items-end shrink-0">
                <span
                  className={cn(
                    "text-lg font-black tabular-nums leading-none",
                    i >= 2 ? "text-white" : "text-foreground"
                  )}
                >
                  {level.count.toLocaleString("pt-BR")}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    i >= 2 ? "text-white/70" : "text-muted-foreground"
                  )}
                >
                  {pct}%
                </span>
              </div>
            </div>

            {/* Conversion arrow between levels */}
            {conversionRate !== null && (
              <div className="flex flex-col items-center py-1.5">
                <div className="h-4 w-0.5 bg-border" />
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 shadow-xs">
                  <svg
                    className="size-3 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-semibold text-foreground">
                    {conversionRate}% avançam
                  </span>
                </div>
                <div className="h-4 w-0.5 bg-border" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
