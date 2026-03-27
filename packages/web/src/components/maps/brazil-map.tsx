"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRAZILIAN_STATES } from "@/lib/constants/states";

export interface BrazilMapProps {
  data: Record<string, number>;
  onStateClick: (uf: string) => void;
  maxCount: number;
  selectedState?: string | null;
}

// Simplified grid layout for Brazil states
// Each cell: [col, row] in a 0-indexed grid
const STATE_GRID: Record<string, { col: number; row: number }> = {
  // Row 0
  RR: { col: 2, row: 0 },
  AP: { col: 4, row: 0 },
  // Row 1
  AM: { col: 1, row: 1 },
  PA: { col: 3, row: 1 },
  MA: { col: 5, row: 1 },
  CE: { col: 6, row: 1 },
  RN: { col: 7, row: 1 },
  PB: { col: 8, row: 1 },
  // Row 2
  AC: { col: 0, row: 2 },
  TO: { col: 3, row: 2 },
  PI: { col: 5, row: 2 },
  PE: { col: 6, row: 2 },
  AL: { col: 7, row: 2 },
  SE: { col: 8, row: 2 },
  // Row 3
  RO: { col: 1, row: 3 },
  MT: { col: 2, row: 3 },
  GO: { col: 3, row: 3 },
  BA: { col: 5, row: 3 },
  // Row 4
  MS: { col: 2, row: 4 },
  DF: { col: 3, row: 4 },
  MG: { col: 4, row: 4 },
  ES: { col: 5, row: 4 },
  // Row 5
  SP: { col: 3, row: 5 },
  RJ: { col: 5, row: 5 },
  // Row 6
  PR: { col: 2, row: 6 },
  SC: { col: 3, row: 6 },
  // Row 7
  RS: { col: 2, row: 7 },
};

const CELL_SIZE = 52;
const CELL_GAP = 4;
const GRID_COLS = 9;
const GRID_ROWS = 8;

const SVG_WIDTH = GRID_COLS * (CELL_SIZE + CELL_GAP);
const SVG_HEIGHT = GRID_ROWS * (CELL_SIZE + CELL_GAP);

function getHeatColor(count: number, maxCount: number): string {
  if (maxCount === 0 || count === 0) return "#f0fdf4";
  const ratio = Math.min(count / maxCount, 1);
  // White → light green → medium green → dark green
  if (ratio < 0.2) return "#bbf7d0";
  if (ratio < 0.4) return "#86efac";
  if (ratio < 0.6) return "#4ade80";
  if (ratio < 0.8) return "#16a34a";
  return "#14532d";
}

function getTextColor(count: number, maxCount: number): string {
  if (maxCount === 0 || count === 0) return "#166534";
  const ratio = Math.min(count / maxCount, 1);
  return ratio >= 0.6 ? "#ffffff" : "#14532d";
}

interface TooltipState {
  uf: string;
  x: number;
  y: number;
}

export function BrazilMap({ data, onStateClick, maxCount, selectedState }: BrazilMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const stateMap = Object.fromEntries(BRAZILIAN_STATES.map((s) => [s.uf, s]));

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="mx-auto w-full max-w-[560px]"
        aria-label="Mapa do Brasil por estado"
      >
        {Object.entries(STATE_GRID).map(([uf, pos]) => {
          const count = data[uf] ?? 0;
          const x = pos.col * (CELL_SIZE + CELL_GAP);
          const y = pos.row * (CELL_SIZE + CELL_GAP);
          const fillColor = getHeatColor(count, maxCount);
          const textColor = getTextColor(count, maxCount);
          const isSelected = selectedState === uf;
          const stateName = stateMap[uf]?.name ?? uf;

          return (
            <g
              key={uf}
              onClick={() => onStateClick(uf)}
              onMouseEnter={() => setTooltip({ uf, x, y })}
              onMouseLeave={() => setTooltip(null)}
              className="cursor-pointer"
              role="button"
              aria-label={`${stateName}: ${count} atletas`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onStateClick(uf);
              }}
            >
              {/* Shadow / glow for selected */}
              {isSelected && (
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={CELL_SIZE + 4}
                  height={CELL_SIZE + 4}
                  rx={10}
                  fill="none"
                  stroke="#009739"
                  strokeWidth={2.5}
                />
              )}
              <rect
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={8}
                fill={fillColor}
                stroke={isSelected ? "#009739" : "#d1d5db"}
                strokeWidth={isSelected ? 2 : 1}
                className="transition-all duration-150 hover:brightness-90"
              />
              {/* UF label */}
              <text
                x={x + CELL_SIZE / 2}
                y={y + CELL_SIZE / 2 - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={700}
                fill={textColor}
                className="pointer-events-none select-none font-mono"
              >
                {uf}
              </text>
              {/* Count */}
              <text
                x={x + CELL_SIZE / 2}
                y={y + CELL_SIZE / 2 + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill={textColor}
                opacity={0.8}
                className="pointer-events-none select-none"
              >
                {count > 0 ? count : "—"}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const count = data[tooltip.uf] ?? 0;
          const stateName = stateMap[tooltip.uf]?.name ?? tooltip.uf;
          const tooltipX = Math.min(tooltip.x + CELL_SIZE + 6, SVG_WIDTH - 130);
          const tooltipY = Math.max(tooltip.y - 4, 0);
          return (
            <g>
              <rect
                x={tooltipX}
                y={tooltipY}
                width={120}
                height={36}
                rx={6}
                fill="#0a1628"
                opacity={0.92}
              />
              <text
                x={tooltipX + 8}
                y={tooltipY + 14}
                fontSize={10}
                fontWeight={600}
                fill="#ffffff"
              >
                {stateName}
              </text>
              <text
                x={tooltipX + 8}
                y={tooltipY + 26}
                fontSize={9}
                fill="#9ca3af"
              >
                {count} atleta{count !== 1 ? "s" : ""}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="mx-auto mt-3 flex max-w-[560px] items-center gap-2 text-xs text-muted-foreground px-2">
        <span>0</span>
        <div className="flex flex-1 h-3 rounded overflow-hidden">
          {["#f0fdf4", "#bbf7d0", "#86efac", "#4ade80", "#16a34a", "#14532d"].map((color) => (
            <div key={color} className="flex-1 h-full" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span>{maxCount > 0 ? maxCount : "max"}</span>
      </div>
    </div>
  );
}
