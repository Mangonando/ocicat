import { connection } from "next/server";
import { getLocations, getTopRegulars, getUpcomingMemberIds } from "@/lib/queries";
import { berlinToday, WEEKDAYS } from "@/lib/format";
import { locationParam } from "@/lib/filters";
import RiderName, { BookedLegend } from "@/components/RiderName";
import LocationSelect from "@/components/LocationSelect";
import { Page, PageHeader } from "@/components/ui";

export const metadata = { title: "Top regulars — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function RegularsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const locations = getLocations();
  const location = locationParam((await searchParams).location, locations);

  const regulars = getTopRegulars(50, location);
  const booked = getUpcomingMemberIds(berlinToday());

  return (
    <Page>
      <PageHeader title="Top regulars">
        {location
          ? `Top ${regulars.length} riders by classes attended at ${location}. Counts and dates only include that studio.`
          : `Top ${regulars.length} riders by classes attended.`}
      </PageHeader>

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
                <tr key={c.member_id}>
                  <td className="col-muted col-number">{i + 1}</td>
                  <td className="col-name">
                    <RiderName memberId={c.member_id} name={c.name} booked={booked.has(c.member_id)} />
                  </td>
                  <td className="col-number" style={{ fontWeight: 500 }}>{c.attended}</td>
                  <td className="col-muted">{c.first_visit ?? "—"}</td>
                  <td className="col-muted">{c.last_visit ?? "—"}</td>
                  <td className="col-muted">{c.fav_location ?? "—"}</td>
                  <td className="col-muted">{c.fav_weekday != null ? WEEKDAYS[c.fav_weekday] : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
