"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OUTCOMES, outcomeShares, type OutcomeShares } from "@/lib/outcomes";
import { BookedMarker } from "@/components/RiderName";

export interface ReliabilityEntry {
  member_id: number;
  name: string;
  booked: boolean;
  resolved: number;
  attended: number;
  no_show: number;
  cancelled: number;
  late_cancel: number;
}

type SortKey = "name" | "resolved" | keyof OutcomeShares;

const PCT_COLUMNS: [keyof OutcomeShares, string][] = [
  ["attended", "Attended %"],
  ["missed", "Missed %"],
  ["no_show", "No-show %"],
  ["cancelled", "Cancelled %"],
  ["late_cancel", "Late cancel %"],
];

function fmtShare(v: number | null): string {
  return v != null ? `${Math.round(v)}%` : "—";
}

export default function ReliabilityTable({ rows }: { rows: ReliabilityEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("missed");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const withShares = useMemo(
    () => rows.map((r) => ({ ...r, shares: outcomeShares(r) })),
    [rows],
  );

  const sorted = useMemo(() => {
    const value = (r: (typeof withShares)[number]) =>
      sortKey === "name" ? r.name : sortKey === "resolved" ? r.resolved : (r.shares[sortKey] ?? -1);
    return [...withShares].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      const cmp = av < bv ? -1 : av > bv ? 1 : b.resolved - a.resolved;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [withShares, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const header = (key: SortKey, label: string) => (
    <th
      key={key}
      onClick={() => handleSort(key)}
      style={{ cursor: "pointer", userSelect: "none" }}
      aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            {header("name", "Name")}
            {header("resolved", "Bookings")}
            <th>Split</th>
            {PCT_COLUMNS.map(([key, label]) => header(key, label))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const missed = r.shares.missed ?? 0;
            return (
              <tr key={r.member_id} className="table-row-alt">
                <td className="col-name">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                    <Link
                      href={`/customers/${r.member_id}`}
                      style={{ color: "var(--color-ink)", textDecorationColor: "var(--color-vista-blue)" }}
                    >
                      {r.name}
                    </Link>
                    {r.booked && <BookedMarker />}
                  </span>
                </td>
                <td className="col-number col-muted">{r.resolved}</td>
                <td>
                  <SplitBar row={r} />
                </td>
                <td className="col-number" style={{ fontWeight: 500 }}>{fmtShare(r.shares.attended)}</td>
                <td
                  className={`col-number${missed >= 50 ? " col-alert" : ""}`}
                  style={{ fontWeight: 500 }}
                >
                  {fmtShare(r.shares.missed)}
                </td>
                <td className={`col-number${(r.shares.no_show ?? 0) >= 15 ? " col-alert" : " col-muted"}`}>
                  {fmtShare(r.shares.no_show)}
                </td>
                <td className="col-number col-muted">{fmtShare(r.shares.cancelled)}</td>
                <td className="col-number col-muted">{fmtShare(r.shares.late_cancel)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SplitBar({ row }: { row: ReliabilityEntry }) {
  const title = OUTCOMES.map((o) => `${o.label}: ${row[o.key]}`).join(" · ");
  return (
    <div
      role="img"
      aria-label={title}
      title={title}
      style={{
        display: "flex",
        width: "8rem",
        height: "12px",
        border: "1.5px solid var(--color-ink)",
        borderRadius: "1px",
        overflow: "hidden",
      }}
    >
      {OUTCOMES.map((o) =>
        row[o.key] > 0 ? (
          <div key={o.key} style={{ flex: row[o.key], backgroundColor: o.color }} />
        ) : null,
      )}
    </div>
  );
}
