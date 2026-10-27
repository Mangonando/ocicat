"use client";

import { useState, useMemo } from "react";
import type { ClassAttendance } from "@/lib/queries";
import { fmtPct } from "@/lib/format";

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
  ["check_ins", "Check-ins"],
  ["no_shows", "No-shows"],
  ["cancellations", "Cancelled"],
  ["late_cancels", "Late cancel"],
  ["attendance_rate", "Check-in rate"],
  ["cancel_rate", "Cancel rate"],
];

/** Sortable class table. Filtering happens in the parent so the whole page follows it. */
export default function AttendanceTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("local_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

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
            {COLUMNS.map(([key, label]) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                style={{ cursor: "pointer", userSelect: "none" }}
                aria-sort={
                  sortKey === key
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                {label}{arrow(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const highNoShow = r.no_shows > 0 && r.total_bookings > 0
              && (r.no_shows / r.total_bookings) > 0.2;
            const rate = r.attendance_rate;
            return (
              <tr key={r.id} className="table-row-alt">
                <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{r.local_date}</td>
                <td className="col-muted">{r.local_time.slice(0, 5)}</td>
                <td className="col-name">{r.name}</td>
                <td className="col-muted">{r.location ?? "—"}</td>
                <td className="col-number">{r.total_bookings}</td>
                <td className="col-number" style={{ fontWeight: 500 }}>{r.check_ins}</td>
                <td
                  className={`col-number${highNoShow ? " col-alert" : ""}`}
                >
                  {r.no_shows}
                </td>
                <td className="col-number col-muted">{r.cancellations}</td>
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
