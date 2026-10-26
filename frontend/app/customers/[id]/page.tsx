import { getCustomerStat, getCustomerVisits } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId) || memberId <= 0) notFound();

  const stat = getCustomerStat(memberId);
  if (!stat) notFound();

  const visits = getCustomerVisits(memberId);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link href="/regulars" className="text-sm text-zinc-500 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold mt-2">{stat.name}</h1>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Attended", value: stat.attended },
          { label: "No-shows", value: stat.no_shows },
          { label: "Cancelled", value: stat.cancelled },
          { label: "Late cancels", value: stat.late_cancels },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white border border-zinc-200 rounded-lg p-4 text-center"
          >
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-zinc-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        First visit: <strong>{stat.first_visit ?? "—"}</strong> · Last visit:{" "}
        <strong>{stat.last_visit ?? "—"}</strong>
      </p>

      {/* Visit history */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Visit history ({visits.length})
        </h2>
        {visits.length === 0 ? (
          <p className="text-zinc-400 text-sm">No visits yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-200">
                <th className="pb-1 pr-4">Date</th>
                <th className="pb-1 pr-4">Day</th>
                <th className="pb-1 pr-4">Class</th>
                <th className="pb-1">Location</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr
                  key={v.booking_id}
                  className="border-b border-zinc-100 hover:bg-zinc-100"
                >
                  <td className="py-1 pr-4">{v.local_date}</td>
                  <td className="py-1 pr-4 text-zinc-500">
                    {DAYS[v.weekday]}
                  </td>
                  <td className="py-1 pr-4">
                    {v.class_name}
                    {!v.is_mine && (
                      <span className="ml-1 text-xs text-zinc-400">(sub)</span>
                    )}
                  </td>
                  <td className="py-1 text-zinc-500">{v.location ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
