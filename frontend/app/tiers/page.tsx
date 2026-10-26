import { getAllCustomerStats } from "@/lib/queries";
import { getTier, TIERS } from "@/lib/tiers";
import Link from "next/link";

export const metadata = { title: "Loyalty tiers — ride analytics" };

export default function TiersPage() {
  const stats = getAllCustomerStats();

  if (stats.length === 0) {
    return <p className="text-zinc-500">No data yet. Run the scraper first.</p>;
  }

  const buckets = TIERS.map((tier) => ({
    ...tier,
    customers: stats.filter((s) => getTier(s.attended).label === tier.label),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Loyalty tiers</h1>

      {/* Summary bar */}
      <div className="grid grid-cols-6 gap-3">
        {buckets.map(({ label, color, customers }) => (
          <div
            key={label}
            className="rounded-lg p-4 text-white text-center"
            style={{ backgroundColor: color }}
          >
            <div className="text-2xl font-bold">{customers.length}</div>
            <div className="text-xs mt-1 opacity-90">{label}</div>
          </div>
        ))}
      </div>

      {/* Per-tier tables */}
      {buckets.map(({ label, color, customers }) =>
        customers.length === 0 ? null : (
          <section key={label}>
            <h2
              className="text-lg font-semibold mb-2 flex items-center gap-2"
            >
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label} — {customers.length} people
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-200">
                  <th className="pb-1 pr-4">Name</th>
                  <th className="pb-1 pr-4">Attended</th>
                  <th className="pb-1 pr-4">First visit</th>
                  <th className="pb-1">Last visit</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
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
                    <td className="py-1 pr-4">{c.attended}</td>
                    <td className="py-1 pr-4 text-zinc-500">{c.first_visit}</td>
                    <td className="py-1 text-zinc-500">{c.last_visit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ),
      )}
    </div>
  );
}
