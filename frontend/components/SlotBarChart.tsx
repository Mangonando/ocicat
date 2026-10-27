"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SlotPoint } from "@/lib/queries";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  data: SlotPoint[];
}

export default function SlotBarChart({ data }: Props) {
  if (data.length === 0) return null;

  const chartData = data.map((s) => ({
    ...s,
    label: `${DAYS[s.weekday]} ${s.local_time.slice(0, 5)}`,
  }));

  const max = Math.max(...chartData.map((d) => d.avg_per_class));

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
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--color-apricot)", fontFamily: "var(--font-mono)", opacity: 0.7 }}
              axisLine={{ stroke: "var(--color-apricot)", strokeOpacity: 0.2 }}
              tickLine={false}
              interval={0}
              angle={-40}
              textAnchor="end"
              height={48}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-apricot)", fontFamily: "var(--font-mono)", opacity: 0.7 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "avg/class",
                angle: -90,
                position: "insideLeft",
                fill: "var(--color-apricot)",
                opacity: 0.45,
                fontSize: 9,
                fontFamily: "var(--font-mono)",
              }}
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
              formatter={(val) => [`${val ?? 0} avg/class`]}
              labelStyle={{ color: "var(--color-chartreuse)", fontWeight: 500 }}
            />
            <Bar
              dataKey="avg_per_class"
              isAnimationActive={true}
              animationDuration={500}
              animationBegin={100}
              animationEasing="ease-out"
              radius={[2, 2, 0, 0]}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.avg_per_class === max ? "var(--color-chartreuse)" : "var(--color-vista-blue)"}
                />
              ))}
            </Bar>
          </BarChart>
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
        Average check-ins per class slot.{" "}
        <span style={{ color: "var(--color-chartreuse)", opacity: 1 }}>Highlighted</span> = best-attended slot.
      </p>
    </div>
  );
}
