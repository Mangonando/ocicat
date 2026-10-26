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
  colors: string[];
}

export default function TrendChart({ data, locations, colors }: Props) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {locations.map((loc, i) => (
          <Bar
            key={loc}
            dataKey={loc}
            stackId="a"
            fill={colors[i % colors.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
