"use client";

import { useMemo } from "react";
import { OUTCOMES, outcomeShares, type Counts, type OutcomeShares } from "@/lib/outcomes";
import RiderName from "@/components/RiderName";
import { NOTE } from "@/components/ui";
import { compareValues, useSort } from "@/components/useSort";

export interface ReliabilityEntry extends Counts {
  member_id: number;
  name: string;
  fav_location: string | null;
  booked: boolean; // has an upcoming booking
  resolved: number; // bookings with an outcome
}

type SortKey = "name" | "fav_location" | "resolved" | keyof OutcomeShares;

const PCT_COLUMNS: [keyof OutcomeShares, string][] = [
  ["checked_in", "Attended %"],
  ["missed", "Missed %"],
  ["no_shows", "No-show %"],
  ["cancelled", "Cancelled %"],
  ["late_cancels", "Late cancel %"],
];

function fmtShare(v: number | null): string {
  return v != null ? `${Math.round(v)}%` : "—";
}

export default function ReliabilityTable({ rows }: { rows: ReliabilityEntry[] }) {
  const sort = useSort<SortKey>("missed", ["name", "fav_location"]);

  const withShares = useMemo(
    () => rows.map((r) => ({ ...r, shares: outcomeShares(r) })),
    [rows],
  );

  const sorted = useMemo(() => {
    const value = (r: (typeof withShares)[number]) =>
      sort.key === "name" || sort.key === "fav_location" || sort.key === "resolved"
        ? r[sort.key]
        : r.shares[sort.key];
    const sign = sort.dir === "asc" ? 1 : -1;
    // Ties: riders with more bookings first, whatever the direction.
    return [...withShares].sort(
      (a, b) => sign * compareValues(value(a), value(b)) || b.resolved - a.resolved,
    );
  }, [withShares, sort.key, sort.dir]);

  if (rows.length === 0) {
    return <p style={NOTE}>No riders with 3+ bookings match this filter.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            {sort.th("name", "Name")}
            {sort.th("fav_location", "Fav location")}
            {sort.th("resolved", "Bookings")}
            <th>Split</th>
            {PCT_COLUMNS.map(([key, label]) => sort.th(key, label))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const missed = r.shares.missed ?? 0;
            return (
              <tr key={r.member_id}>
                <td className="col-name">
                  <RiderName memberId={r.member_id} name={r.name} booked={r.booked} />
                </td>
                <td className="col-muted">{r.fav_location ?? "—"}</td>
                <td className="col-number col-muted">{r.resolved}</td>
                <td>
                  <SplitBar row={r} />
                </td>
                <td className="col-number" style={{ fontWeight: 500 }}>{fmtShare(r.shares.checked_in)}</td>
                <td
                  className={`col-number${missed >= 50 ? " col-alert" : ""}`}
                  style={{ fontWeight: 500 }}
                >
                  {fmtShare(r.shares.missed)}
                </td>
                <td className={`col-number${(r.shares.no_shows ?? 0) >= 15 ? " col-alert" : " col-muted"}`}>
                  {fmtShare(r.shares.no_shows)}
                </td>
                <td className="col-number col-muted">{fmtShare(r.shares.cancelled)}</td>
                <td className="col-number col-muted">{fmtShare(r.shares.late_cancels)}</td>
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
