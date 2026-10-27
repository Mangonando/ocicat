import { connection } from "next/server";
import { getPastClasses } from "@/lib/queries";
import { berlinToday } from "@/lib/format";
import LocationsDashboard from "@/components/LocationsDashboard";

export const metadata = { title: "Locations & trends — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function LocationsPage() {
  await connection();
  // Everything on this page counts past classes only: upcoming ones have no check-ins yet.
  const today = berlinToday();
  const rows = getPastClasses(today);

  if (rows.length === 0) {
    return (
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>Locations & trends</h1>
        <p style={{ marginTop: "1rem", opacity: 0.55 }}>No data yet. Run the scraper first.</p>
      </div>
    );
  }

  const locations = [...new Set(rows.map((r) => r.location))].sort();

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          letterSpacing: "-0.01em",
          marginBottom: "1rem",
        }}
      >
        Locations & trends
      </h1>
      <LocationsDashboard rows={rows} locations={locations} today={today} />
    </div>
  );
}
