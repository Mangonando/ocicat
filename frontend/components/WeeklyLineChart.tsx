"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { WeeklyPoint } from "@/lib/queries";

interface Props {
  data: WeeklyPoint[];
}

function formatWeek(week: string): string {
  const [, w] = week.split("-W");
  return `W${w}`;
}

export default function WeeklyLineChart({ data }: Props) {
  if (data.length === 0) return null;

  const avg = Math.round(data.reduce((s, d) => s + d.attended, 0) / data.length);
  const displayData = data.slice(-20).map((d) => ({ ...d, label: formatWeek(d.week) }));

  return (
    <div>
      <div
        style={{
          backgroundColor: "var(--color-ink)",
          border: "2px solid var(--color-ink)",
          borderRadius: "var(--radius)",
          padding: "1.25rem 1rem 0.5rem",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={displayData} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-apricot)", fontFamily: "var(--font-mono)", opacity: 0.7 }}
              axisLine={{ stroke: "var(--color-apricot)", strokeOpacity: 0.2 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-apricot)", fontFamily: "var(--font-mono)", opacity: 0.7 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-ink)",
                border: "2px solid var(--color-chartreuse)",
                borderRadius: "var(--radius)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-apricot)",
              }}
              formatter={(val) => [val ?? 0, "checked in"]}
              labelFormatter={(l) => `Week ${l}`}
            />
            <ReferenceLine
              y={avg}
              stroke="var(--color-vista-blue)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: `avg ${avg}`,
                fill: "var(--color-vista-blue)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                position: "insideTopRight",
              }}
            />
            <Line
              type="monotone"
              dataKey="attended"
              stroke="var(--color-chartreuse)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "var(--color-chartreuse)", stroke: "var(--color-ink)", strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p
        style={{
          marginTop: "0.5rem",
          fontSize: "0.6875rem",
          fontFamily: "var(--font-mono)",
          color: "var(--color-ink)",
          opacity: 0.55,
        }}
      >
        Weekly check-ins — last {displayData.length} weeks.{" "}
        <span style={{ color: "var(--color-vista-blue)", opacity: 1 }}>Dashed</span> = rolling average ({avg}/week).
      </p>
    </div>
  );
}
