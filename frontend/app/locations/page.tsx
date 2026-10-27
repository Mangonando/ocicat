import { connection } from "next/server";
import { getPastClasses } from "@/lib/queries";
import { berlinToday } from "@/lib/format";
import LocationsDashboard from "@/components/LocationsDashboard";
import { EmptyState, Page, PageHeader } from "@/components/ui";

export const metadata = { title: "Locations & trends — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function LocationsPage() {
  await connection();
  // Everything on this page counts past classes only: upcoming ones have no check-ins yet.
  const today = berlinToday();
  const rows = getPastClasses(today);

  if (rows.length === 0) {
    return <EmptyState title="Locations & trends" />;
  }

  const locations = [...new Set(rows.map((r) => r.location))].sort();

  return (
    <Page>
      <PageHeader title="Locations & trends" />
      <LocationsDashboard rows={rows} locations={locations} today={today} />
    </Page>
  );
}
