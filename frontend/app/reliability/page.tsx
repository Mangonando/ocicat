import { getReliabilityStats } from "@/lib/queries";
import Link from "next/link";

export const metadata = { title: "Reliability — ride.bln analytics" };

export default function ReliabilityPage() {
  const rows = getReliabilityStats(3);

  if (rows.length === 0) {
    return (
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>Reliability</h1>
        <p style={{ marginTop: "1rem", opacity: 0.55 }}>No data yet. Run the scraper first.</p>
      </div>
    );
  }

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
        Reliability
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "2rem" }}>
        No-show rate = no-shows ÷ (attended + no-shows). Students with 3+ bookings shown.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Signups</th>
              <th>Attended</th>
              <th>No-shows</th>
              <th>Cancelled</th>
              <th>Late cancel</th>
              <th>No-show %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const rate = c.no_show_rate ?? 0;
              const isHigh = rate >= 30;
              const isMid = rate >= 15 && rate < 30;
              return (
                <tr key={c.member_id} className="table-row-alt">
                  <td className="col-name">
                    <Link
                      href={`/customers/${c.member_id}`}
                      style={{ color: "var(--color-ink)", textDecorationColor: "var(--color-vista-blue)" }}
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="col-number col-muted">{c.signups}</td>
                  <td className="col-number" style={{ fontWeight: 500 }}>{c.attended}</td>
                  <td
                    className={`col-number${isHigh ? " col-alert" : ""}`}
                    style={isMid && !isHigh ? { color: "var(--color-tomato)", opacity: 0.65 } : undefined}
                  >
                    {c.no_shows}
                  </td>
                  <td className="col-number col-muted">{c.cancelled}</td>
                  <td className="col-number col-muted">{c.late_cancels}</td>
                  <td
                    className="col-number"
                    style={{
                      fontWeight: isHigh ? 500 : undefined,
                      color: isHigh
                        ? "var(--color-tomato)"
                        : isMid
                          ? "var(--color-ink)"
                          : undefined,
                    }}
                  >
                    {c.no_show_rate != null ? `${c.no_show_rate}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
