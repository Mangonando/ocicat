import { connection } from "next/server";
import { getReliabilityStats, getUpcomingMemberIds } from "@/lib/queries";
import { berlinToday } from "@/lib/format";
import { OUTCOMES } from "@/lib/outcomes";
import { BookedLegend } from "@/components/RiderName";
import ReliabilityTable, { type ReliabilityEntry } from "@/components/ReliabilityTable";

export const metadata = { title: "Reliability — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function ReliabilityPage() {
  await connection();
  const stats = getReliabilityStats(3);
  const booked = getUpcomingMemberIds(berlinToday());

  if (stats.length === 0) {
    return (
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>Reliability</h1>
        <p style={{ marginTop: "1rem", opacity: 0.55 }}>No data yet. Run the scraper first.</p>
      </div>
    );
  }

  const rows: ReliabilityEntry[] = stats.map((s) => ({
    member_id: s.member_id,
    name: s.name,
    booked: booked.has(s.member_id),
    resolved: s.checked_in + s.no_shows + s.cancelled + s.late_cancels,
    attended: s.checked_in,
    no_show: s.no_shows,
    cancelled: s.cancelled,
    late_cancel: s.late_cancels,
  }));

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          letterSpacing: "-0.01em",
          marginBottom: "0.25rem",
        }}
      >
        Reliability
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "1rem", maxWidth: "48rem" }}>
        How each rider&apos;s past bookings ended, as a share of all their bookings that have an
        outcome (upcoming bookings are left out). Attended + no-show + cancelled + late cancel =
        100%. Missed = no-show + cancelled + late cancel. Riders with 3+ such bookings shown. Click
        a column to sort.
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem 1.25rem",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          marginBottom: "0.5rem",
        }}
      >
        {OUTCOMES.map((o) => (
          <span key={o.key} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span className="swatch" style={{ backgroundColor: o.color }} />
            {o.label}
          </span>
        ))}
      </div>
      <BookedLegend />
      <ReliabilityTable rows={rows} />
    </div>
  );
}
