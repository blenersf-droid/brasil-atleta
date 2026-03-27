import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
  badge?: React.ReactNode;
  /** "improvement" = green dot, "decline" = red dot, "neutral" = gray dot */
  trend?: "improvement" | "decline" | "neutral";
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const TREND_DOT: Record<NonNullable<TimelineItem["trend"]>, string> = {
  improvement: "bg-[#009739] shadow-[0_0_0_3px_rgba(0,151,57,0.15)]",
  decline: "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
  neutral: "bg-[#0a1628]/20 shadow-[0_0_0_3px_rgba(10,22,40,0.06)]",
};

export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Nenhum resultado encontrado
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
          O historico de competicoes aparecera aqui conforme os resultados forem registrados.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute top-3 bottom-3 left-[11px] w-px bg-gradient-to-b from-border via-border to-transparent" />

      <div className="flex flex-col gap-0">
        {items.map((item, index) => {
          const trend = item.trend ?? "neutral";
          const dotClass = TREND_DOT[trend];

          return (
            <div key={item.id} className="relative flex gap-4">
              {/* Dot */}
              <div className="relative z-10 mt-3 flex-shrink-0">
                <div
                  className={cn(
                    "size-[10px] rounded-full transition-all",
                    dotClass
                  )}
                />
              </div>

              {/* Content */}
              <div
                className={cn(
                  "flex-1 pb-6",
                  index === items.length - 1 && "pb-0"
                )}
              >
                {/* Date */}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                  {item.date}
                </p>

                {/* Card */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    {item.badge && (
                      <div className="flex-shrink-0">{item.badge}</div>
                    )}
                  </div>

                  {item.content && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      {item.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
