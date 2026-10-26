import { getLocationSummaries, getMonthlyByLocation } from "@/lib/queries";
import TrendChart from "@/components/TrendChart";

export const metadata = { title: "Locations & trends — ride analytics" };

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626"];

export default function LocationsPage() {
  const summaries = getLocationSummaries();
  const monthly = getMonthlyByLocation();

  if (summaries.length === 0) {
    return <p className="text-zinc-500">No data yet. Run the scraper first.</p>;
  }

  // Build chart data: one object per month with keys per location
  const locations = [...new Set(monthly.map((r) => r.location))];
  const months = [...new Set(monthly.map((r) => r.month))].sort();

  const chartData = months.map((month) => {
    const point: { month: string; [k: string]: string | number } = { month };
    for (const loc of locations) {
      point[loc] =
        monthly.find((r) => r.month === month && r.location === loc)
          ?.headcount ?? 0;
    }
    return point;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Locations & trends</h1>

      {/* Location summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaries.map((s, i) => (
          <div
            key={s.location}
            className="rounded-lg p-4 text-white"
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
          >
            <div className="text-sm font-medium opacity-90">{s.location}</div>
            <div className="text-3xl font-bold mt-1">{s.total_headcount}</div>
            <div className="text-xs mt-1 opacity-80">
              {s.classes} classes · avg {s.avg_per_class}/class
            </div>
          </div>
        ))}
      </div>

      {/* Monthly trend chart */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Monthly attendance</h2>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <TrendChart data={chartData} locations={locations} colors={COLORS} />
        </div>
      </div>

      {/* Monthly table */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Raw numbers</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-zinc-200">
              <th className="pb-1 pr-4">Month</th>
              {locations.map((loc) => (
                <th key={loc} className="pb-1 pr-4">
                  {loc}
                </th>
              ))}
              <th className="pb-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => {
              const total = locations.reduce(
                (sum, loc) => sum + (Number(row[loc]) || 0),
                0,
              );
              return (
                <tr
                  key={row.month}
                  className="border-b border-zinc-100 hover:bg-zinc-100"
                >
                  <td className="py-1 pr-4 font-medium">{row.month}</td>
                  {locations.map((loc) => (
                    <td key={loc} className="py-1 pr-4 text-zinc-600">
                      {row[loc] || 0}
                    </td>
                  ))}
                  <td className="py-1 font-semibold">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
