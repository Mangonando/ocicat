import { connection } from "next/server";
import { getClassAttendance } from "@/lib/queries";
import { berlinToday } from "@/lib/format";
import OverviewDashboard from "@/components/OverviewDashboard";
import { EmptyState, Page } from "@/components/ui";

export const metadata = { title: "riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function Home() {
  await connection();
  const classes = getClassAttendance();

  if (classes.length === 0) {
    return <EmptyState title="Overview" />;
  }

  return (
    <Page>
      <OverviewDashboard rows={classes} today={berlinToday()} />
    </Page>
  );
}
