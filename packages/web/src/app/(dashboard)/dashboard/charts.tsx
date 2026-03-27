"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── Shared Tooltip ────────────────────────────────────────────────────────────

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0a1628] px-3 py-2 shadow-xl">
      {label && (
        <p className="mb-1 text-xs font-medium text-white/60">{label}</p>
      )}
      <p className="font-mono text-sm font-semibold text-white">
        {payload[0].value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0a1628] px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-medium text-white/60">{payload[0].name}</p>
      <p className="font-mono text-sm font-semibold text-white">
        {payload[0].value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

// ── Chart Card wrapper ────────────────────────────────────────────────────────

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a1628] p-5 shadow-lg">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Region Chart ─────────────────────────────────────────────────────────────

export interface RegionDataPoint {
  region: string;
  count: number;
}

export function RegionChart({ data }: { data: RegionDataPoint[] }) {
  return (
    <ChartCard title="Atletas por Regiao">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="region"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="count" fill="#009739" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Level Chart ───────────────────────────────────────────────────────────────

export interface LevelDataPoint {
  level: string;
  count: number;
}

const LEVEL_COLORS = ["#94a3b8", "#3b82f6", "#009739", "#eab308"];

export function LevelChart({ data }: { data: LevelDataPoint[] }) {
  return (
    <ChartCard title="Por Nivel Competitivo">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="level"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((entry, i) => (
          <span key={entry.level} className="flex items-center gap-1.5 text-xs text-white/50">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: LEVEL_COLORS[i % LEVEL_COLORS.length] }}
            />
            {entry.level}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}

// ── Modality Chart ────────────────────────────────────────────────────────────

export interface ModalityDataPoint {
  name: string;
  count: number;
}

export function ModalityChart({ data }: { data: ModalityDataPoint[] }) {
  return (
    <ChartCard title="Top 10 Modalidades por Atletas">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="count" fill="#009739" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
