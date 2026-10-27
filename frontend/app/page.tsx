import { connection } from "next/server";
import { getClassAttendance } from "@/lib/queries";
import { berlinToday } from "@/lib/format";
import OverviewDashboard from "@/components/OverviewDashboard";

export const metadata = { title: "riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function Home() {
  await connection();
  const classes = getClassAttendance();

  if (classes.length === 0) {
    return (
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
            marginBottom: "1rem",
          }}
        >
          No data yet
        </h1>
        <p style={{ opacity: 0.6 }}>
          Run <code style={{ fontFamily: "var(--font-mono)" }}>python scrape.py</code> to
          populate the database.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
      <OverviewDashboard rows={classes} today={berlinToday()} />
    </div>
  );
}
