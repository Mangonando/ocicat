import { connection } from "next/server";
import { getUpcomingBookings, type UpcomingBooking } from "@/lib/queries";
import Link from "next/link";
import { berlinToday, shortDate, WEEKDAYS } from "@/lib/format";
import { studioColor, studioShort } from "@/lib/studios";
import { Page, PageHeader } from "@/components/ui";

export const metadata = { title: "Upcoming classes — riders analytics" };

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

function formatDate(iso: string): string {
  const weekday = WEEKDAYS[(new Date(iso + "T00:00:00Z").getUTCDay() + 6) % 7];
  return `${weekday} ${shortDate(iso)}`;
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
  return [...map.values()].sort(
    (a, b) =>
      a.local_date.localeCompare(b.local_date) || a.local_time.localeCompare(b.local_time),
  );
}

export default async function UpcomingPage() {
  await connection();

  const today = berlinToday();
  const twoWeeks = berlinToday(new Date(new Date().getTime() + 14 * 86_400_000));

  const rows = getUpcomingBookings(today, twoWeeks);
  const classes = groupByClass(rows);
  const totalClasses = classes.length;

  return (
    <Page>
      <PageHeader title="Upcoming classes">
        Next 14 days · {totalClasses} class{totalClasses !== 1 ? "es" : ""} with bookings ·{" "}
        {rows.length} total bookings
      </PageHeader>

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

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {classes.map((cls) => (
          <ClassCard key={cls.class_id} cls={cls} />
        ))}
      </div>
    </Page>
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
          <StudioLabel location={cls.location} />
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

function StudioLabel({ location }: { location: string | null }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        backgroundColor: studioColor(location),
        color: "var(--color-ink)",
        padding: "1px 6px",
        borderRadius: "var(--radius)",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {studioShort(location)}
    </span>
  );
}
