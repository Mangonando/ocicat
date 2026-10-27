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
import { AXIS_LINE, AXIS_TICK, CHART_PANEL, TOOLTIP_STYLE } from "@/lib/chartTheme";
import type { SlotPoint } from "@/lib/locations";
import { WEEKDAYS } from "@/lib/format";

interface Props {
  data: SlotPoint[];
}

export default function SlotBarChart({ data }: Props) {
  if (data.length === 0) return null;

  const chartData = data.map((s) => ({
    ...s,
    label: `${WEEKDAYS[s.weekday]} ${s.local_time.slice(0, 5)}`,
  }));

  const max = Math.max(...chartData.map((d) => d.avg_per_class));

  return (
    <div>
      <div
        style={CHART_PANEL}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              axisLine={AXIS_LINE}
              tickLine={false}
              interval={0}
              angle={chartData.length > 4 ? -40 : 0}
              textAnchor={chartData.length > 4 ? "end" : "middle"}
              height={chartData.length > 4 ? 48 : 24}
            />
            <YAxis
              tick={AXIS_TICK}
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
              contentStyle={TOOLTIP_STYLE}
              formatter={(val) => [`${val ?? 0} avg/class`]}
              labelStyle={{ color: "var(--color-chartreuse)", fontWeight: 500 }}
              itemStyle={{ color: "var(--color-apricot)" }}
              cursor={{ fill: "var(--color-apricot)", fillOpacity: 0.08 }}
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
        <span className="swatch" style={{ backgroundColor: "var(--color-chartreuse)", verticalAlign: "middle" }} /> = best-attended slot.
      </p>
    </div>
  );
}
