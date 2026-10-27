"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AXIS_LINE, AXIS_TICK, CHART_PANEL, TOOLTIP_STYLE } from "@/lib/chartTheme";
import type { Counts } from "@/lib/outcomes";
import { mondayOf, shortDate, weekRange } from "@/lib/format";
import { studioColor, studioShort } from "@/lib/studios";
import { Swatch } from "@/components/ui";

interface Props {
  /** Already filtered by the page (class name, location, dates). One row per class or day. */
  data: (Counts & { local_date: string; location: string })[];
  locations: string[]; // one line per studio listed
  rangeLabel: string | null; // the page's active date range, for the caption
}

const METRICS: { key: keyof Counts; label: string; unit: string }[] = [
  { key: "checked_in", label: "Check-ins", unit: "checked in" },
  { key: "no_shows", label: "No-shows", unit: "no-shows" },
  { key: "cancelled", label: "Cancels", unit: "cancelled" },
  { key: "late_cancels", label: "Late cancels", unit: "late cancels" },
];

export default function WeeklyLineChart({ data, locations, rangeLabel: activeRange }: Props) {
  const [metric, setMetric] = useState<keyof Counts>("checked_in");
  const current = METRICS.find((m) => m.key === metric)!;

  const chartData = useMemo(() => {
    // Sum classes into Monday-start weeks. Rows arrive filtered, so a date range can cut mid-week.
    const totals = new Map<string, number>(); // "week|location" → value
    for (const d of data) {
      const key = `${mondayOf(d.local_date)}|${d.location}`;
      totals.set(key, (totals.get(key) ?? 0) + d[metric]);
    }
    const allWeeks = [...new Set([...totals.keys()].map((k) => k.split("|")[0]))].sort();
    const weeks = activeRange ? allWeeks : allWeeks.slice(-20);
    return weeks.map((week_start) => {
      const point: { week_start: string; label: string; [loc: string]: string | number | null } = {
        week_start,
        label: shortDate(week_start),
      };
      for (const loc of locations) {
        // No class at that studio that week → a gap, not a false zero.
        point[loc] = totals.get(`${week_start}|${loc}`) ?? null;
      }
      return point;
    });
  }, [data, locations, metric, activeRange]);

  if (data.length === 0) return null;

  // Average only for a single studio; with two lines it would be ambiguous.
  const single = locations.length === 1 ? locations[0] : null;
  const singleValues = single
    ? chartData.map((d) => d[single]).filter((v): v is number => typeof v === "number")
    : [];
  const avg = singleValues.length > 0
    ? Math.round(singleValues.reduce((s, v) => s + v, 0) / singleValues.length)
    : null;

  return (
    <div>
      {/* Metric picker; studios and dates come from the page filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem 1.25rem", marginBottom: "0.75rem", alignItems: "center" }}>
        <div role="group" aria-label="Metric" style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              className="toggle"
              aria-pressed={metric === m.key}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
          {locations.map((loc) => (
            <Swatch key={loc} color={studioColor(loc)}>
              {studioShort(loc)}
            </Swatch>
          ))}
        </div>
      </div>

      <div
        style={CHART_PANEL}
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              axisLine={AXIS_LINE}
              tickLine={false}
              minTickGap={12}
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--color-apricot)", fontWeight: 500 }}
              formatter={(val, name) => [val == null ? "no class" : `${val} ${current.unit}`, studioShort(String(name))]}
              labelFormatter={(_, payload) => {
                const week = payload?.[0]?.payload?.week_start;
                return week ? weekRange(String(week)) : "";
              }}
            />
            {avg != null && (
              <ReferenceLine
                y={avg}
                stroke="var(--color-apricot)"
                strokeOpacity={0.6}
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `avg ${avg}`,
                  fill: "var(--color-apricot)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  position: "insideTopRight",
                }}
              />
            )}
            {locations.map((loc) => (
                <Line
                  key={loc}
                  type="monotone"
                  dataKey={loc}
                  name={loc}
                  connectNulls
                  stroke={studioColor(loc)}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: studioColor(loc), strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: studioColor(loc), stroke: "var(--color-ink)", strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              ))}
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
        {current.label} per week (week starting Monday), past classes only,{" "}
        {activeRange ? activeRange : `last ${chartData.length} weeks`}.
        Weeks without a class at a studio are skipped, not counted as zero.
        {avg != null && " Dashed = average per week."}
      </p>
    </div>
  );
}
