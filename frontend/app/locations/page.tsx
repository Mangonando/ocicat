import {
  getLocationSummaries,
  getMonthlyByLocation,
  getWeeklyAttendance,
  getSlotAttendance,
} from "@/lib/queries";
import TrendChart from "@/components/TrendChart";
import WeeklyLineChart from "@/components/WeeklyLineChart";
import SlotBarChart from "@/components/SlotBarChart";

export const metadata = { title: "Locations & trends — ride.bln analytics" };

export default function LocationsPage() {
  const summaries = getLocationSummaries();
  const monthly = getMonthlyByLocation();
  const weekly = getWeeklyAttendance();
  const slots = getSlotAttendance();

  if (summaries.length === 0) {
    return (
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>Locations & trends</h1>
        <p style={{ marginTop: "1rem", opacity: 0.55 }}>No data yet. Run the scraper first.</p>
      </div>
    );
  }

  const locations = [...new Set(monthly.map((r) => r.location))];
  const months = [...new Set(monthly.map((r) => r.month))].sort();
  const chartData = months.map((month) => {
    const point: { month: string; [k: string]: string | number } = { month };
    for (const loc of locations) {
      point[loc] = monthly.find((r) => r.month === month && r.location === loc)?.headcount ?? 0;
    }
    return point;
  });

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          letterSpacing: "-0.01em",
          marginBottom: "2rem",
        }}
      >
        Locations & trends
      </h1>

      {/* Location summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {summaries.map((s, i) => (
          <div
            key={s.location}
            style={{
              backgroundColor: i % 2 === 0 ? "var(--color-chartreuse)" : "var(--color-vista-blue)",
              border: "2px solid var(--color-ink)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-md)",
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                opacity: 0.65,
                marginBottom: "0.375rem",
              }}
            >
              {s.location}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {s.total_headcount}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                marginTop: "0.375rem",
                opacity: 0.55,
              }}
            >
              {s.classes} classes · avg {s.avg_per_class}/class
            </div>
          </div>
        ))}
      </div>

      {/* Chart pair */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              marginBottom: "0.75rem",
            }}
          >
            Attendance by slot
          </h2>
          <SlotBarChart data={slots} />
        </div>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              marginBottom: "0.75rem",
            }}
          >
            Weekly check-ins
          </h2>
          <WeeklyLineChart data={weekly} />
        </div>
      </div>

      {/* Monthly stacked bar */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            marginBottom: "0.75rem",
          }}
        >
          Monthly attendance by location
        </h2>
        <TrendChart data={chartData} locations={locations} />
      </div>

      {/* Monthly table */}
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          marginBottom: "0.75rem",
        }}
      >
        Monthly breakdown
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              {locations.map((loc) => (
                <th key={loc}>{loc}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => {
              const total = locations.reduce((sum, loc) => sum + (Number(row[loc]) || 0), 0);
              return (
                <tr key={row.month} className="table-row-alt">
                  <td className="col-muted">{row.month}</td>
                  {locations.map((loc) => (
                    <td key={loc} className="col-number col-muted">
                      {row[loc] || 0}
                    </td>
                  ))}
                  <td className="col-number" style={{ fontWeight: 500 }}>{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
