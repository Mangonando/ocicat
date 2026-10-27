import { connection } from "next/server";
import { getAllCustomerStats, getUpcomingMemberIds } from "@/lib/queries";
import { isLapsed, isOneAndDone } from "@/lib/tiers";
import { berlinToday } from "@/lib/format";
import RiderName, { BookedLegend } from "@/components/RiderName";
import { Page, PageHeader, SectionTitle } from "@/components/ui";

export const metadata = { title: "Lapsed — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function LapsedPage() {
  await connection();

  const stats = getAllCustomerStats();
  const today = new Date();
  const booked = getUpcomingMemberIds(berlinToday(today));
  const oneAndDone = stats.filter((s) => isOneAndDone(s.attended, s.last_visit, today));
  const lapsed = stats.filter((s) => isLapsed(s.attended, s.last_visit, today));

  return (
    <Page>
      <PageHeader title="Lapsed riders" />
      <BookedLegend />

      <section style={{ marginBottom: "2.5rem" }}>
        <SectionTitle count={oneAndDone.length} style={{ marginBottom: "0.25rem" }}>
          One-and-done
        </SectionTitle>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "1rem" }}>
          Came 1–2×, last visit more than 30 days ago.
        </p>
        {oneAndDone.length === 0 ? (
          <p style={{ opacity: 0.45, fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
            None right now — great sign.
          </p>
        ) : (
          <CustomerTable rows={oneAndDone} booked={booked} />
        )}
      </section>

      <section>
        <SectionTitle count={lapsed.length} style={{ marginBottom: "0.25rem" }}>
          Lapsed
        </SectionTitle>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "1rem" }}>
          5+ visits but absent more than 28 days.
        </p>
        {lapsed.length === 0 ? (
          <p style={{ opacity: 0.45, fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
            No one lapsed. Keep it up.
          </p>
        ) : (
          <CustomerTable rows={lapsed} booked={booked} />
        )}
      </section>
    </Page>
  );
}

function CustomerTable({
  rows,
  booked,
}: {
  rows: ReturnType<typeof getAllCustomerStats>;
  booked: Set<number>;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Attended</th>
            <th>First visit</th>
            <th>Last visit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.member_id}>
              <td className="col-name">
                <RiderName memberId={c.member_id} name={c.name} booked={booked.has(c.member_id)} />
              </td>
              <td className="col-number" style={{ fontWeight: 500 }}>{c.attended}</td>
              <td className="col-muted">{c.first_visit ?? "—"}</td>
              <td
                className="col-muted"
                style={{ color: "var(--color-tomato)" }}
              >
                {c.last_visit ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
