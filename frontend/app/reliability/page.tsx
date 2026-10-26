import { getReliabilityStats } from "@/lib/queries";
import Link from "next/link";

export const metadata = { title: "Reliability — ride analytics" };

export default function ReliabilityPage() {
  const rows = getReliabilityStats(3);

  if (rows.length === 0) {
    return <p className="text-zinc-500">No data yet. Run the scraper first.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Reliability</h1>
      <p className="text-zinc-500 text-sm">
        No-show rate = no-shows / (attended + no-shows). Only people with 3+
        non-cancelled bookings shown.
      </p>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-zinc-500 border-b border-zinc-200">
            <th className="pb-1 pr-4">Name</th>
            <th className="pb-1 pr-4">Signups</th>
            <th className="pb-1 pr-4">Attended</th>
            <th className="pb-1 pr-4">No-shows</th>
            <th className="pb-1 pr-4">Cancelled</th>
            <th className="pb-1 pr-4">Late cancel</th>
            <th className="pb-1">No-show %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr
              key={c.member_id}
              className="border-b border-zinc-100 hover:bg-zinc-100"
            >
              <td className="py-1 pr-4">
                <Link
                  href={`/customers/${c.member_id}`}
                  className="hover:underline text-blue-700"
                >
                  {c.name}
                </Link>
              </td>
              <td className="py-1 pr-4 text-zinc-600">{c.signups}</td>
              <td className="py-1 pr-4">{c.attended}</td>
              <td className="py-1 pr-4">{c.no_shows}</td>
              <td className="py-1 pr-4 text-zinc-500">{c.cancelled}</td>
              <td className="py-1 pr-4 text-zinc-500">{c.late_cancels}</td>
              <td className="py-1">
                <span
                  className={
                    (c.no_show_rate ?? 0) >= 30
                      ? "text-red-600 font-semibold"
                      : (c.no_show_rate ?? 0) >= 15
                        ? "text-orange-500"
                        : "text-zinc-600"
                  }
                >
                  {c.no_show_rate != null ? `${c.no_show_rate}%` : "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
