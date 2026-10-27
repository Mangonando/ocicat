import { getSummaryStats, getClassAttendance } from "@/lib/queries";
import DonutChart from "@/components/DonutChart";
import AttendanceTable from "@/components/AttendanceTable";

export const metadata = { title: "ride.bln analytics" };

export default function Home() {
  const stats = getSummaryStats();
  const classes = getClassAttendance();

  const attendanceRate =
    stats && stats.total_attended + stats.total_no_shows > 0
      ? Math.round(
          (100 * stats.total_attended) /
            (stats.total_attended + stats.total_no_shows),
        )
      : null;
  const noShowRate =
    stats && stats.total_attended + stats.total_no_shows > 0
      ? Math.round(
          (100 * stats.total_no_shows) /
            (stats.total_attended + stats.total_no_shows),
        )
      : null;

  const donutSlices =
    stats
      ? [
          {
            label: "Check-ins",
            value: stats.total_attended,
            color: "var(--color-chartreuse)",
          },
          {
            label: "No-shows",
            value: stats.total_no_shows,
            color: "var(--color-tomato)",
          },
          {
            label: "Cancelled",
            value: stats.total_cancelled,
            color: "var(--color-vista-blue)",
          },
        ]
      : [];

  if (!stats || stats.total_classes === 0) {
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
      {/* Summary strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {[
          { label: "classes", value: stats.total_classes.toLocaleString() },
          { label: "bookings", value: stats.total_bookings.toLocaleString() },
          { label: "students", value: stats.unique_students.toLocaleString() },
          {
            label: "check-in rate",
            value: attendanceRate != null ? `${attendanceRate}%` : "—",
          },
          {
            label: "no-show rate",
            value: noShowRate != null ? `${noShowRate}%` : "—",
            alert: noShowRate != null && noShowRate > 10,
          },
        ].map(({ label, value, alert }) => (
          <div
            key={label}
            className="card"
            style={{ padding: "1.25rem 1.5rem" }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: (alert as boolean | undefined) ? "var(--color-tomato)" : "var(--color-ink)",
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                marginTop: "0.375rem",
                opacity: 0.65,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "2rem",
          alignItems: "start",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              letterSpacing: "-0.01em",
              marginBottom: "0.25rem",
            }}
          >
            Attendance
          </h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              opacity: 0.55,
              marginBottom: "1.5rem",
            }}
          >
            All classes since the first scrape. Each booking counts as its own row.
          </p>
        </div>
        <DonutChart slices={donutSlices} size={200} />
      </div>

      {/* Primary table */}
      <AttendanceTable rows={classes} />
    </div>
  );
}
