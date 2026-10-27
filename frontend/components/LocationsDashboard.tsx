"use client";

import { useMemo } from "react";
import type { Counts } from "@/lib/queries";
import { fmt, monthLabel, rangeLabel } from "@/lib/format";
import { outcomeShares } from "@/lib/outcomes";
import { studioColor, studioShort } from "@/lib/studios";
import {
  avgPerClass,
  monthlyByLocation,
  recurringSlots,
  slotAttendance,
  summarizeByLocation,
  type PastClass,
} from "@/lib/locations";
import ClassFilters, { useClassFilters } from "@/components/ClassFilters";
import TrendChart from "@/components/TrendChart";
import WeeklyLineChart from "@/components/WeeklyLineChart";
import SlotBarChart from "@/components/SlotBarChart";
import DonutChart from "@/components/DonutChart";

const ZERO: Counts = { checked_in: 0, no_shows: 0, cancelled: 0, late_cancels: 0 };

function sharesOf(c: Counts) {
  return outcomeShares({
    attended: c.checked_in,
    no_show: c.no_shows,
    cancelled: c.cancelled,
    late_cancel: c.late_cancels,
  });
}

const H2 = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--text-lg)",
  marginBottom: "0.75rem",
} as const;

const NOTE = {
  marginTop: "0.5rem",
  fontSize: "0.6875rem",
  fontFamily: "var(--font-mono)",
  color: "var(--color-ink)",
  opacity: 0.55,
} as const;

interface Props {
  rows: PastClass[]; // all past classes
  locations: string[];
  today: string;
}

/** Locations page body: the filter bar drives every card, chart and table below it. */
export default function LocationsDashboard({ rows, locations: allLocations, today }: Props) {
  const { filters, setFilters, filtered } = useClassFilters(rows);
  const activeRange = rangeLabel(filters.range);
  const currentMonth = today.slice(0, 7);

  // Recurring slots come from all past classes, so a short range doesn't hide regular slots.
  const recurring = useMemo(() => recurringSlots(rows, 3), [rows]);
  const summaries = useMemo(() => summarizeByLocation(filtered), [filtered]);
  const monthly = useMemo(() => monthlyByLocation(filtered), [filtered]);
  const slots = useMemo(() => slotAttendance(filtered, recurring), [filtered, recurring]);

  const locations = summaries.map((s) => s.location);
  const months = [...new Set(monthly.map((r) => r.month))].sort();
  const label = (month: string) =>
    month === currentMonth ? `${monthLabel(month)} (so far)` : monthLabel(month);
  const cell = (month: string, loc: string) =>
    monthly.find((r) => r.month === month && r.location === loc);

  const headcountData = months.map((month) => {
    const point: { month: string; [k: string]: string | number } = { month: label(month) };
    for (const loc of locations) point[loc] = cell(month, loc)?.checked_in ?? 0;
    return point;
  });
  const avgData = months.map((month) => {
    const point: { month: string; [k: string]: string | number } = { month: label(month) };
    for (const loc of locations) {
      const c = cell(month, loc);
      point[loc] = c ? (avgPerClass(c.checked_in, c.classes) ?? 0) : 0;
    }
    return point;
  });

  const tableRows = months.map((month) => {
    const perLoc = locations.map((loc) => cell(month, loc));
    const total = perLoc.reduce<Counts & { classes: number }>(
      (acc, c) => ({
        classes: acc.classes + (c?.classes ?? 0),
        checked_in: acc.checked_in + (c?.checked_in ?? 0),
        no_shows: acc.no_shows + (c?.no_shows ?? 0),
        cancelled: acc.cancelled + (c?.cancelled ?? 0),
        late_cancels: acc.late_cancels + (c?.late_cancels ?? 0),
      }),
      { ...ZERO, classes: 0 },
    );
    return { month, perLoc, total, shares: sharesOf(total) };
  });

  const fmtShare = (v: number | null) => (v != null ? `${Math.round(v)}%` : "—");

  return (
    <>
      <ClassFilters
        filters={filters}
        onChange={setFilters}
        locations={allLocations}
        today={today}
        shown={filtered.length}
        total={rows.length}
      />
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "2rem" }}>
        {activeRange && <strong style={{ fontWeight: 500 }}>{activeRange}. </strong>}
        Past classes only. Upcoming classes have no check-ins yet and would show as false zeros.
        The filters apply to everything on this page.
      </p>

      {filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", opacity: 0.55 }}>
          No classes match these filters.
        </p>
      ) : (
        <>
          {/* Location summary cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "2.5rem",
            }}
          >
            {summaries.map((s) => (
              <div
                key={s.location}
                style={{
                  backgroundColor: studioColor(s.location),
                  border: "2px solid var(--color-ink)",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-md)",
                  padding: "1.25rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    opacity: 0.65,
                    marginBottom: "0.375rem",
                  }}
                >
                  {s.location}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-2xl)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {fmt(s.checked_in)}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    marginTop: "0.375rem",
                    opacity: 0.55,
                  }}
                >
                  check-ins · {s.classes} class{s.classes !== 1 ? "es" : ""} · avg {s.avg_per_class ?? "—"}/class
                </div>
              </div>
            ))}
          </div>

          {/* Booking outcomes per studio */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={H2}>Booking outcomes by studio</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem" }}>
              {summaries.map((s) => (
                <div key={s.location} style={{ maxWidth: "22rem" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: 500, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <span className="swatch" style={{ backgroundColor: studioColor(s.location) }} />
                    {s.location}
                  </div>
                  <DonutChart
                    size={180}
                    label={`${s.location} booking outcomes`}
                    slices={[
                      { label: "Check-ins", value: s.checked_in, color: "var(--color-status-attended)" },
                      { label: "No-shows", value: s.no_shows, color: "var(--color-status-no-show)" },
                      { label: "Cancelled", value: s.cancelled, color: "var(--color-status-cancelled)" },
                      { label: "Late cancels", value: s.late_cancels, color: "var(--color-status-late-cancel)" },
                    ]}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Slots */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={H2}>Attendance by slot</h2>
            <SlotBarChart data={slots} />
            <p style={NOTE}>Recurring slots only (3+ classes overall), so one-off subs don&apos;t skew the chart.</p>
          </div>

          {/* Weekly lines per studio */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={H2}>Weekly by studio</h2>
            <WeeklyLineChart data={filtered} locations={locations} rangeLabel={activeRange} />
          </div>

          {/* Monthly charts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "2rem",
              marginBottom: "2.5rem",
            }}
          >
            <div>
              <h2 style={H2}>Monthly check-ins by location</h2>
              <TrendChart data={headcountData} locations={locations} />
            </div>
            <div>
              <h2 style={H2}>Avg check-ins per class</h2>
              <TrendChart data={avgData} locations={locations} stacked={false} />
              <p style={NOTE}>Evens out months with more or fewer classes (cancellations, holidays).</p>
            </div>
          </div>

          {/* Monthly table */}
          <h2 style={H2}>Monthly breakdown</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th rowSpan={2}>Month</th>
                  {locations.map((loc) => (
                    <th key={loc} colSpan={3} style={{ borderLeft: "1px solid var(--color-apricot)" }}>
                      {studioShort(loc)}
                    </th>
                  ))}
                  <th colSpan={3} style={{ borderLeft: "1px solid var(--color-apricot)" }}>Total</th>
                  <th colSpan={4} style={{ borderLeft: "1px solid var(--color-apricot)" }}>% of bookings</th>
                </tr>
                <tr>
                  {[...locations, "total"].map((loc) => (
                    <ColGroupHeaders key={loc} />
                  ))}
                  <th style={{ borderLeft: "1px solid var(--color-apricot)" }}>Attended</th>
                  <th>No-show</th>
                  <th>Cancelled</th>
                  <th>Late cancel</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(({ month, perLoc, total, shares }) => (
                  <tr key={month} className="table-row-alt">
                    <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{label(month)}</td>
                    {perLoc.map((c, i) => (
                      <MonthCells key={locations[i]} checkIns={c?.checked_in ?? 0} classes={c?.classes ?? 0} />
                    ))}
                    <MonthCells checkIns={total.checked_in} classes={total.classes} bold />
                    <td className="col-number" style={{ fontWeight: 500 }}>{fmtShare(shares.attended)}</td>
                    <td className="col-number col-muted">{fmtShare(shares.no_show)}</td>
                    <td className="col-number col-muted">{fmtShare(shares.cancelled)}</td>
                    <td className="col-number col-muted">{fmtShare(shares.late_cancel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={NOTE}>
            Classes = classes held that month. Avg = check-ins per class. % of bookings: how all bookings
            for that month&apos;s classes ended (adds up to 100%).
          </p>
        </>
      )}
    </>
  );
}

function ColGroupHeaders() {
  return (
    <>
      <th style={{ borderLeft: "1px solid var(--color-apricot)" }}>Check-ins</th>
      <th>Classes</th>
      <th>Avg</th>
    </>
  );
}

function MonthCells({ checkIns, classes, bold }: { checkIns: number; classes: number; bold?: boolean }) {
  const a = avgPerClass(checkIns, classes);
  return (
    <>
      <td className="col-number" style={{ fontWeight: bold ? 500 : undefined }}>{fmt(checkIns)}</td>
      <td className="col-number col-muted">{classes}</td>
      <td className="col-number col-muted">{a != null ? a : "—"}</td>
    </>
  );
}
