"use client";

import { useState, useMemo } from "react";
import type { ClassAttendance } from "@/lib/queries";

interface Props {
  rows: ClassAttendance[];
}

type SortKey = keyof ClassAttendance;

export default function AttendanceTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("local_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterClass, setFilterClass] = useState("");
  const [filterLoc, setFilterLoc] = useState("");

  const locations = useMemo(
    () => [...new Set(rows.map((r) => r.location ?? "Unknown"))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    let out = rows;
    if (filterClass) out = out.filter((r) => r.name.toLowerCase().includes(filterClass.toLowerCase()));
    if (filterLoc) out = out.filter((r) => (r.location ?? "Unknown") === filterLoc);
    return out;
  }, [rows, filterClass, filterLoc]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

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

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="search"
          placeholder="Filter by class name"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            padding: "0.375rem 0.625rem",
            border: "2px solid var(--color-ink)",
            borderRadius: "var(--radius)",
            backgroundColor: "var(--color-apricot)",
            color: "var(--color-ink)",
            width: "14rem",
          }}
        />
        <select
          value={filterLoc}
          onChange={(e) => setFilterLoc(e.target.value)}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            padding: "0.375rem 0.625rem",
            border: "2px solid var(--color-ink)",
            borderRadius: "var(--radius)",
            backgroundColor: "var(--color-apricot)",
            color: "var(--color-ink)",
          }}
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-ink)",
            opacity: 0.55,
            alignSelf: "center",
          }}
        >
          {sorted.length} of {rows.length} classes
        </span>
      </div>

      {/* Note: bookings ≠ unique people */}
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--color-ink)",
          opacity: 0.55,
          marginBottom: "0.75rem",
        }}
      >
        Each booking row is one signup, including when one person books for friends — these are not unique people counts.
      </p>

      {sorted.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", opacity: 0.55 }}>
          No classes match these filters.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {(
                  [
                    ["local_date", "Date"],
                    ["local_time", "Time"],
                    ["name", "Class"],
                    ["location", "Location"],
                    ["total_bookings", "Bookings"],
                    ["check_ins", "Check-ins"],
                    ["no_shows", "No-shows"],
                    ["cancellations", "Cancelled"],
                    ["attendance_rate", "Rate"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
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
                    <td className="col-muted">{r.local_date}</td>
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
                    <td
                      className="col-number"
                      style={{
                        fontWeight: 500,
                        color: rate != null && rate < 70
                          ? "var(--color-tomato)"
                          : "var(--color-ink)",
                      }}
                    >
                      {rate != null ? `${rate}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
