import { connection } from "next/server";
import { getLocations, getTopRegulars, getUpcomingMemberIds } from "@/lib/queries";
import { berlinToday } from "@/lib/format";
import RiderName, { BookedLegend } from "@/components/RiderName";
import LocationSelect from "@/components/LocationSelect";

export const metadata = { title: "Top regulars — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function RegularsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const { location: rawLocation } = await searchParams;
  const locations = getLocations();
  // Only accept a studio we know, so the query never sees arbitrary input.
  const location =
    typeof rawLocation === "string" && locations.includes(rawLocation) ? rawLocation : null;

  const regulars = getTopRegulars(50, location);
  const booked = getUpcomingMemberIds(berlinToday());

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
        Top regulars
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "1.5rem" }}>
        {location
          ? `Top ${regulars.length} riders by classes attended at ${location}. Counts and dates only include that studio.`
          : `Top ${regulars.length} riders by classes attended.`}
      </p>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
        <LocationSelect locations={locations} value={location ?? ""} />
      </div>
      <BookedLegend />

      {regulars.length === 0 ? (
        <p style={{ marginTop: "1rem", opacity: 0.55 }}>No data yet. Run the scraper first.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "2.5rem" }}>#</th>
                <th>Name</th>
                <th>Attended</th>
                <th>First visit</th>
                <th>Last visit</th>
                <th>Fav location</th>
                <th>Fav day</th>
              </tr>
            </thead>
            <tbody>
              {regulars.map((c, i) => (
                <tr key={c.member_id} className="table-row-alt">
                  <td className="col-muted col-number">{i + 1}</td>
                  <td className="col-name">
                    <RiderName memberId={c.member_id} name={c.name} booked={booked.has(c.member_id)} />
                  </td>
                  <td className="col-number" style={{ fontWeight: 500 }}>{c.attended}</td>
                  <td className="col-muted">{c.first_visit ?? "—"}</td>
                  <td className="col-muted">{c.last_visit ?? "—"}</td>
                  <td className="col-muted">{c.fav_location ?? "—"}</td>
                  <td className="col-muted">{c.fav_weekday != null ? DAYS[c.fav_weekday] : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
