import { connection } from "next/server";
import { getUpcomingBookings, type UpcomingBooking } from "@/lib/queries";
import Link from "next/link";

export const metadata = { title: "Upcoming classes — ride.bln analytics" };

const LOCATIONS = ["Studio Charlottenburg", "Studio Prenzlauer Berg"];

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

interface ClassGroup {
  class_id: number;
  class_name: string;
  local_date: string;
  local_time: string;
  location: string | null;
  capacity: number | null;
  bookings: UpcomingBooking[];
}

function groupByClass(rows: UpcomingBooking[]): ClassGroup[] {
  const map = new Map<number, ClassGroup>();
  for (const r of rows) {
    if (!map.has(r.class_id)) {
      map.set(r.class_id, {
        class_id: r.class_id,
        class_name: r.class_name,
        local_date: r.local_date,
        local_time: r.local_time,
        location: r.location,
        capacity: r.capacity,
        bookings: [],
      });
    }
    map.get(r.class_id)!.bookings.push(r);
  }
  return [...map.values()].sort((a, b) => a.local_date.localeCompare(b.local_date));
}

export default async function UpcomingPage() {
  await connection();

  const today = new Date()
    .toLocaleDateString("sv", { timeZone: "Europe/Berlin" })
    .slice(0, 10);
  const twoWeeks = new Date(new Date().getTime() + 14 * 86_400_000)
    .toLocaleDateString("sv", { timeZone: "Europe/Berlin" })
    .slice(0, 10);

  const rows = getUpcomingBookings(today, twoWeeks);
  const totalClasses = new Set(rows.map((r) => r.class_id)).size;

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
        Upcoming classes
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "2rem" }}>
        Next 14 days · {totalClasses} class{totalClasses !== 1 ? "es" : ""} with bookings ·{" "}
        {rows.length} total bookings
      </p>

      {rows.length === 0 && (
        <div
          className="card-apricot"
          style={{ padding: "1.25rem", maxWidth: "28rem" }}
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
            No upcoming bookings found. Run{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
              python scrape.py --force
            </code>{" "}
            to fetch them.
          </p>
        </div>
      )}

      {LOCATIONS.map((loc) => {
        const classes = groupByClass(rows.filter((r) => r.location === loc));
        if (classes.length === 0) return null;
        return (
          <section key={loc} style={{ marginBottom: "2.5rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                borderBottom: "2px solid var(--color-ink)",
                paddingBottom: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              {loc}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {classes.map((cls) => (
                <ClassCard key={cls.class_id} cls={cls} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ClassCard({ cls }: { cls: ClassGroup }) {
  const firstTimers = cls.bookings.filter((b) => b.attended === 0).length;

  return (
    <div
      style={{
        border: "2px solid var(--color-ink)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Card header */}
      <div
        style={{
          backgroundColor: "var(--color-ink)",
          color: "var(--color-apricot)",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)" }}>
            {cls.class_name}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.6 }}>
            {formatDate(cls.local_date)} · {cls.local_time}
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <span>
            {cls.bookings.length} booked{cls.capacity ? ` / ${cls.capacity}` : ""}
          </span>
          {firstTimers > 0 && (
            <span
              style={{
                backgroundColor: "var(--color-chartreuse)",
                color: "var(--color-ink)",
                padding: "1px 6px",
                borderRadius: "var(--radius)",
                fontWeight: 500,
              }}
            >
              {firstTimers} first
            </span>
          )}
        </div>
      </div>

      {/* Bookings table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Attended</th>
            <th>Last class</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cls.bookings.map((b) => {
            const isFirst = b.attended === 0;
            return (
              <tr
                key={b.member_id}
                className="table-row-alt"
                style={
                  isFirst
                    ? { backgroundColor: "color-mix(in srgb, var(--color-chartreuse) 18%, var(--color-apricot))" }
                    : undefined
                }
              >
                <td className="col-name">
                  <Link
                    href={`/customers/${b.member_id}`}
                    style={{ color: "var(--color-ink)", textDecorationColor: "var(--color-vista-blue)" }}
                  >
                    {b.customer_name}
                  </Link>
                </td>
                <td className="col-number" style={{ fontWeight: 500 }}>{b.attended}</td>
                <td className="col-muted">{b.last_visit ?? "—"}</td>
                <td>
                  {isFirst && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6875rem",
                        backgroundColor: "var(--color-chartreuse)",
                        color: "var(--color-ink)",
                        padding: "1px 6px",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--color-ink)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      first class
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
