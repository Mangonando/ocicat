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

interface MonthPoint {
  month: string;
  [location: string]: string | number;
}

interface Props {
  data: MonthPoint[];
  locations: string[];
}

const PALETTE = [
  "var(--color-chartreuse)",
  "var(--color-vista-blue)",
  "var(--color-tomato)",
  "var(--color-tier-4)",
];

export default function TrendChart({ data, locations }: Props) {
  if (data.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "var(--color-ink)",
        border: "2px solid var(--color-ink)",
        borderRadius: "var(--radius)",
        padding: "1.25rem 1rem 0.5rem",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
          <XAxis
            dataKey="month"
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
          />
          <Legend
            wrapperStyle={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-apricot)",
              paddingTop: "0.5rem",
            }}
          />
          {locations.map((loc, i) => (
            <Bar
              key={loc}
              dataKey={loc}
              stackId="a"
              fill={PALETTE[i % PALETTE.length]}
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
