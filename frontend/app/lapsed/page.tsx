import { getAllCustomerStats } from "@/lib/queries";
import { isLapsed, isOneAndDone } from "@/lib/tiers";
import Link from "next/link";

export const metadata = { title: "One-and-done / lapsed — ride analytics" };

export default async function LapsedPage() {
  const { connection } = await import("next/server");
  await connection();

  const stats = getAllCustomerStats();
  const today = new Date();
  const oneAndDone = stats.filter((s) =>
    isOneAndDone(s.attended, s.last_visit, today),
  );
  const lapsed = stats.filter((s) => isLapsed(s.attended, s.last_visit, today));

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold">One-and-done / lapsed</h1>

      <section>
        <h2 className="text-lg font-semibold mb-1">
          One-and-done ({oneAndDone.length})
        </h2>
        <p className="text-zinc-500 text-sm mb-3">
          Came 1–2×, last visit more than 30 days ago.
        </p>
        {oneAndDone.length === 0 ? (
          <p className="text-zinc-400 text-sm">None.</p>
        ) : (
          <CustomerTable rows={oneAndDone} />
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-1">Lapsed ({lapsed.length})</h2>
        <p className="text-zinc-500 text-sm mb-3">
          5+ visits but absent more than 28 days.
        </p>
        {lapsed.length === 0 ? (
          <p className="text-zinc-400 text-sm">None.</p>
        ) : (
          <CustomerTable rows={lapsed} />
        )}
      </section>
    </div>
  );
}

function CustomerTable({
  rows,
}: {
  rows: ReturnType<typeof getAllCustomerStats>;
}) {
  return (
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
            <td className="py-1 pr-4">{c.attended}</td>
            <td className="py-1 pr-4 text-zinc-500">{c.first_visit}</td>
            <td className="py-1 text-zinc-500">{c.last_visit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
