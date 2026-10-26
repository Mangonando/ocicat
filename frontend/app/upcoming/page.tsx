import { connection } from "next/server";
import { getUpcomingBookings, type UpcomingBooking } from "@/lib/queries";
import Link from "next/link";

export const metadata = { title: "Upcoming classes — ride analytics" };

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
  const twoWeeks = new Date(Date.now() + 14 * 86_400_000)
    .toLocaleDateString("sv", { timeZone: "Europe/Berlin" })
    .slice(0, 10);

  const rows = getUpcomingBookings(today, twoWeeks);
  const totalClasses = new Set(rows.map((r) => r.class_id)).size;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Upcoming classes</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Next 14 days · {totalClasses} class{totalClasses !== 1 ? "es" : ""}{" "}
          with bookings · {rows.length} total bookings
        </p>
      </div>

      {rows.length === 0 && (
        <p className="text-zinc-400">
          No upcoming bookings found. Run{" "}
          <code className="bg-zinc-800 px-1 rounded">
            python scrape.py --force
          </code>{" "}
          to fetch them.
        </p>
      )}

      {LOCATIONS.map((loc) => {
        const classes = groupByClass(rows.filter((r) => r.location === loc));
        if (classes.length === 0) return null;
        return (
          <section key={loc}>
            <h2 className="text-xl font-semibold border-b border-zinc-200 pb-2 mb-4">
              {loc}
            </h2>
            <div className="space-y-6">
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
    <div className="border border-zinc-200 rounded-lg overflow-hidden">
      <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-semibold">{cls.class_name}</span>
          <span className="ml-3 text-zinc-400 text-sm">
            {formatDate(cls.local_date)} · {cls.local_time}
          </span>
        </div>
        <div className="text-sm text-zinc-300">
          {cls.bookings.length} booked
          {cls.capacity ? ` / ${cls.capacity}` : ""}
          {firstTimers > 0 && (
            <span className="ml-2 text-amber-400">
              · {firstTimers} first-timer{firstTimers > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500 bg-zinc-50 border-b border-zinc-200">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Attended</th>
            <th className="px-4 py-2">Last class</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {cls.bookings.map((b) => {
            const isFirst = b.attended === 0;
            return (
              <tr
                key={b.member_id}
                className={`border-b border-zinc-100 hover:bg-zinc-50 ${isFirst ? "bg-amber-50" : ""}`}
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/customers/${b.member_id}`}
                    className="hover:underline text-blue-700"
                  >
                    {b.customer_name}
                  </Link>
                </td>
                <td className="px-4 py-2 font-semibold">{b.attended}</td>
                <td className="px-4 py-2 text-zinc-500">
                  {b.last_visit ?? "—"}
                </td>
                <td className="px-4 py-2">
                  {isFirst && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
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
