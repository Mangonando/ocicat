"use client";

import { useMemo } from "react";
import type { ClassAttendance } from "@/lib/queries";
import { summarize } from "@/lib/overview";
import { fmt, fmtPct, rangeLabel } from "@/lib/format";
import DonutChart from "@/components/DonutChart";
import AttendanceTable from "@/components/AttendanceTable";
import ClassFilters, { useClassFilters } from "@/components/ClassFilters";

interface Props {
  rows: ClassAttendance[];
  today: string;
}

/** Overview page body: the filters drive the tiles, the donut and the table together. */
export default function OverviewDashboard({ rows, today }: Props) {
  const { filters, setFilters, filtered } = useClassFilters(rows);

  const locations = useMemo(
    () => [...new Set(rows.map((r) => r.location ?? "Unknown"))].sort(),
    [rows],
  );
  const s = useMemo(() => summarize(filtered), [filtered]);
  const isFiltered = filtered.length !== rows.length;
  const activeRange = rangeLabel(filters.range);

  const tiles: { label: string; value: string; alert?: boolean }[] = [
    { label: "classes", value: fmt(s.classes) },
    { label: "bookings", value: fmt(s.bookings) },
    { label: "riders", value: fmt(s.riders) },
    { label: "check-in rate", value: fmtPct(s.checkInRate) },
    { label: "no-show rate", value: fmtPct(s.noShowRate), alert: s.noShowRate != null && s.noShowRate > 10 },
    { label: "cancel rate", value: fmtPct(s.cancelRate) },
    { label: "late cancel rate", value: fmtPct(s.lateCancelRate) },
  ];

  const donutSlices = [
    { label: "Check-ins", value: s.check_ins, color: "var(--color-status-attended)" },
    { label: "No-shows", value: s.no_shows, color: "var(--color-status-no-show)" },
    { label: "Cancelled", value: s.cancelled, color: "var(--color-status-cancelled)" },
    { label: "Late cancels", value: s.late_cancels, color: "var(--color-status-late-cancel)" },
    { label: "Booked (upcoming)", value: s.booked, color: "var(--color-status-booked)" },
  ];

  return (
    <>
      {/* Filters — apply to everything below */}
      <ClassFilters
        filters={filters}
        onChange={setFilters}
        locations={locations}
        today={today}
        shown={filtered.length}
        total={rows.length}
      />

      {/* Summary strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {tiles.map(({ label, value, alert }) => (
          <div
            key={label}
            className="card"
            style={{ padding: "1.25rem 1.5rem" }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: alert ? "var(--color-tomato)" : "var(--color-ink)",
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                marginTop: "0.375rem",
                opacity: 0.65,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "2rem",
          alignItems: "start",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              letterSpacing: "-0.01em",
              marginBottom: "0.25rem",
            }}
          >
            Attendance
          </h2>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              opacity: 0.55,
              marginBottom: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
              maxWidth: "34rem",
            }}
          >
            <p>
              {activeRange && (
                <strong style={{ fontWeight: 500, opacity: 1 }}>{activeRange}. </strong>
              )}
              {isFiltered ? "Classes matching the filters." : "All classes since the first scrape."}{" "}
              Each booking counts as its own row, including when one person books for friends,
              so bookings are not unique people.
            </p>
            <p>
              Bookings include {fmt(s.booked)} still booked for upcoming classes. Check-in and
              no-show rates use check-ins + no-shows; cancel rates use all bookings.
            </p>
          </div>
        </div>
        {s.bookings > 0 && <DonutChart slices={donutSlices} size={200} />}
      </div>

      {/* Primary table */}
      <AttendanceTable rows={filtered} />
    </>
  );
}
