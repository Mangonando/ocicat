"use client";

import { useMemo } from "react";
import type { ClassAttendance } from "@/lib/queries";
import { fmtPct } from "@/lib/format";
import { compareValues, useSort } from "@/components/useSort";

interface Props {
  rows: ClassAttendance[];
}

type SortKey = Exclude<keyof ClassAttendance, "member_ids">;

const COLUMNS: [SortKey, string][] = [
  ["local_date", "Date"],
  ["local_time", "Time"],
  ["name", "Class"],
  ["location", "Location"],
  ["total_bookings", "Bookings"],
  ["checked_in", "Check-ins"],
  ["no_shows", "No-shows"],
  ["cancelled", "Cancelled"],
  ["late_cancels", "Late cancel"],
  ["attendance_rate", "Check-in rate"],
  ["cancel_rate", "Cancel rate"],
];

/** Sortable class table. Filtering happens in the parent so the whole page follows it. */
export default function AttendanceTable({ rows }: Props) {
  const sort = useSort<SortKey>("local_date");

  const sorted = useMemo(() => {
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => sign * compareValues(a[sort.key], b[sort.key]));
  }, [rows, sort.key, sort.dir]);

  if (sorted.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", opacity: 0.55 }}>
        No classes match these filters.
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            {COLUMNS.map(([key, label]) => sort.th(key, label))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const highNoShow = r.no_shows > 0 && r.total_bookings > 0
              && (r.no_shows / r.total_bookings) > 0.2;
            const rate = r.attendance_rate;
            return (
              <tr key={r.id}>
                <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{r.local_date}</td>
                <td className="col-muted">{r.local_time.slice(0, 5)}</td>
                <td className="col-name">{r.name}</td>
                <td className="col-muted">{r.location ?? "—"}</td>
                <td className="col-number">{r.total_bookings}</td>
                <td className="col-number" style={{ fontWeight: 500 }}>{r.checked_in}</td>
                <td
                  className={`col-number${highNoShow ? " col-alert" : ""}`}
                >
                  {r.no_shows}
                </td>
                <td className="col-number col-muted">{r.cancelled}</td>
                <td className="col-number col-muted">{r.late_cancels}</td>
                <td
                  className="col-number"
                  style={{
                    fontWeight: 500,
                    color: rate != null && rate < 70
                      ? "var(--color-tomato)"
                      : "var(--color-ink)",
                  }}
                >
                  {fmtPct(rate != null ? Math.round(rate) : null)}
                </td>
                <td className="col-number col-muted">
                  {fmtPct(r.cancel_rate != null ? Math.round(r.cancel_rate) : null)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
