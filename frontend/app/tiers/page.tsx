import { connection } from "next/server";
import { getAllCustomerStats, getUpcomingMemberIds } from "@/lib/queries";
import { getTier, TIERS } from "@/lib/tiers";
import { berlinToday } from "@/lib/format";
import RiderName, { BookedLegend } from "@/components/RiderName";

export const metadata = { title: "Cadence — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function TiersPage() {
  await connection();
  const stats = getAllCustomerStats();
  const booked = getUpcomingMemberIds(berlinToday());

  if (stats.length === 0) {
    return (
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>Cadence</h1>
        <p style={{ marginTop: "1rem", opacity: 0.55 }}>No data yet. Run the scraper first.</p>
      </div>
    );
  }

  const buckets = TIERS.map((tier) => ({
    ...tier,
    customers: stats.filter((s) => getTier(s.attended).label === tier.label),
  }));
  const total = stats.length;

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
        Cadence
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "2rem" }}>
        {total} riders, grouped by how many classes they have attended.
      </p>

      {/* Proportional tier bar */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "flex",
            height: "56px",
            border: "2px solid var(--color-ink)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
          }}
          role="img"
          aria-label="Tier distribution bar chart"
        >
          {buckets.map(({ label, color, customers }) =>
            customers.length === 0 ? null : (
              <div
                key={label}
                style={{
                  flex: customers.length,
                  backgroundColor: color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRight: "1px solid var(--color-ink)",
                  transition: "flex 300ms ease",
                }}
                title={`${label}: ${customers.length} riders (${Math.round((customers.length / total) * 100)}%)`}
              >
                {customers.length / total > 0.08 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 500 }}>
                    {label}
                  </span>
                )}
              </div>
            ),
          )}
        </div>
        {/* Legend */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem 1.5rem",
            marginTop: "0.75rem",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
          }}
        >
          {buckets.map(({ label, color, customers }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  backgroundColor: color,
                  border: "1.5px solid var(--color-ink)",
                  borderRadius: "1px",
                  flexShrink: 0,
                }}
              />
              {label} — {customers.length}
            </span>
          ))}
        </div>
      </div>

      <BookedLegend />

      {/* Per-tier tables */}
      {buckets.map(({ label, color, customers }) =>
        customers.length === 0 ? null : (
          <section key={label} style={{ marginBottom: "2rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.625rem",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  backgroundColor: color,
                  border: "2px solid var(--color-ink)",
                  borderRadius: "1px",
                  flexShrink: 0,
                }}
              />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", margin: 0 }}>
                {label}
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  opacity: 0.55,
                }}
              >
                {customers.length} rider{customers.length !== 1 ? "s" : ""}
              </span>
            </div>
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
                  {customers.map((c) => (
                    <tr key={c.member_id} className="table-row-alt">
                      <td className="col-name">
                        <RiderName memberId={c.member_id} name={c.name} booked={booked.has(c.member_id)} />
                      </td>
                      <td className="col-number" style={{ fontWeight: 500 }}>{c.attended}</td>
                      <td className="col-muted">{c.first_visit ?? "—"}</td>
                      <td className="col-muted">{c.last_visit ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ),
      )}
    </div>
  );
}
