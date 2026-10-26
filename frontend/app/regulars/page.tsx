import { getTopRegulars } from "@/lib/queries";
import Link from "next/link";

export const metadata = { title: "Top regulars — ride analytics" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function RegularsPage() {
  const regulars = getTopRegulars(50);

  if (regulars.length === 0) {
    return <p className="text-zinc-500">No data yet. Run the scraper first.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Top regulars</h1>
      <p className="text-zinc-500 text-sm">
        Top {regulars.length} by attended count.
      </p>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-zinc-500 border-b border-zinc-200">
            <th className="pb-1 pr-2">#</th>
            <th className="pb-1 pr-4">Name</th>
            <th className="pb-1 pr-4">Attended</th>
            <th className="pb-1 pr-4">First visit</th>
            <th className="pb-1 pr-4">Last visit</th>
            <th className="pb-1 pr-4">Fav location</th>
            <th className="pb-1">Fav day</th>
          </tr>
        </thead>
        <tbody>
          {regulars.map((c, i) => (
            <tr
              key={c.member_id}
              className="border-b border-zinc-100 hover:bg-zinc-100"
            >
              <td className="py-1 pr-2 text-zinc-400">{i + 1}</td>
              <td className="py-1 pr-4">
                <Link
                  href={`/customers/${c.member_id}`}
                  className="hover:underline text-blue-700"
                >
                  {c.name}
                </Link>
              </td>
              <td className="py-1 pr-4 font-semibold">{c.attended}</td>
              <td className="py-1 pr-4 text-zinc-500">{c.first_visit}</td>
              <td className="py-1 pr-4 text-zinc-500">{c.last_visit}</td>
              <td className="py-1 pr-4 text-zinc-600">
                {c.fav_location ?? "—"}
              </td>
              <td className="py-1 text-zinc-600">
                {c.fav_weekday != null ? DAYS[c.fav_weekday] : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
