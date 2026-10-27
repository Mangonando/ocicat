import { connection } from "next/server";
import { getReliabilityStats, getUpcomingMemberIds } from "@/lib/queries";
import { berlinToday } from "@/lib/format";
import { OUTCOMES, totalOf } from "@/lib/outcomes";
import { BookedLegend } from "@/components/RiderName";
import ReliabilityTable, { type ReliabilityEntry } from "@/components/ReliabilityTable";
import { EmptyState, Legend, Page, PageHeader, Swatch } from "@/components/ui";

export const metadata = { title: "Reliability — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function ReliabilityPage() {
  await connection();
  const stats = getReliabilityStats(3);
  const booked = getUpcomingMemberIds(berlinToday());

  if (stats.length === 0) {
    return <EmptyState title="Reliability" />;
  }

  const rows: ReliabilityEntry[] = stats.map((s) => ({
    ...s,
    booked: booked.has(s.member_id),
    resolved: totalOf(s),
  }));

  return (
    <Page>
      <PageHeader title="Reliability">
        How each rider&apos;s past bookings ended, as a share of all their bookings that have an
        outcome (upcoming bookings are left out). Attended + no-show + cancelled + late cancel =
        100%. Missed = no-show + cancelled + late cancel. Riders with 3+ such bookings shown. Click
        a column to sort.
      </PageHeader>
      <Legend style={{ marginBottom: "0.5rem" }}>
        {OUTCOMES.map((o) => (
          <Swatch key={o.key} color={o.color}>
            {o.label}
          </Swatch>
        ))}
      </Legend>
      <BookedLegend />
      <ReliabilityTable rows={rows} />
    </Page>
  );
}
