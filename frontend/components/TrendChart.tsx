"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AXIS_LINE, AXIS_TICK, CHART_PANEL, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { studioColor } from "@/lib/studios";

interface MonthPoint {
  month: string;
  [location: string]: string | number;
}

interface Props {
  data: MonthPoint[];
  locations: string[];
  /** Stacked bars add up to a total; side-by-side bars compare averages. */
  stacked?: boolean;
  xKey?: string;
}

export default function TrendChart({ data, locations, stacked = true, xKey = "month" }: Props) {
  if (data.length === 0) return null;
  return (
    <div
      style={CHART_PANEL}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
          <XAxis
            dataKey={xKey}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend
            wrapperStyle={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-apricot)",
              paddingTop: "0.5rem",
            }}
          />
          {locations.map((loc) => (
            <Bar
              key={loc}
              dataKey={loc}
              stackId={stacked ? "a" : undefined}
              fill={studioColor(loc)}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
