import { connection } from "next/server";
import { getLocations, getRiderStats, getUpcomingMemberIds } from "@/lib/queries";
import { locationParam } from "@/lib/filters";
import { getTier, TIERS } from "@/lib/tiers";
import { berlinToday } from "@/lib/format";
import RiderName, { BookedLegend } from "@/components/RiderName";
import LocationSelect from "@/components/LocationSelect";
import { EmptyState, Page, PageHeader } from "@/components/ui";

export const metadata = { title: "Cadence — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function TiersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const locations = getLocations();
  const location = locationParam((await searchParams).location, locations);
  const stats = getRiderStats(location);
  const booked = getUpcomingMemberIds(berlinToday());

  if (stats.length === 0 && !location) {
    return <EmptyState title="Cadence" />;
  }

  const buckets = TIERS.map((tier) => ({
    ...tier,
    customers: stats.filter((s) => getTier(s.attended).label === tier.label),
  }));
  const total = stats.length;

  return (
    <Page>
      <PageHeader title="Cadence">
        {location
          ? `${total} riders, grouped by how many classes they have attended at ${location}. Counts and dates only include that studio.`
          : `${total} riders, grouped by how many classes they have attended.`}
      </PageHeader>
      <div style={{ marginBottom: "1.5rem" }}>
        <LocationSelect locations={locations} value={location ?? ""} />
      </div>

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
                    <th>Fav location</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.member_id}>
                      <td className="col-name">
                        <RiderName memberId={c.member_id} name={c.name} booked={booked.has(c.member_id)} />
                      </td>
                      <td className="col-number" style={{ fontWeight: 500 }}>{c.attended}</td>
                      <td className="col-muted">{c.first_visit ?? "—"}</td>
                      <td className="col-muted">{c.last_visit ?? "—"}</td>
                      <td className="col-muted">{c.fav_location ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ),
      )}
    </Page>
  );
}
