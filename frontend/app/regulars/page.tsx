import { getTopRegulars } from "@/lib/queries";
import Link from "next/link";

export const metadata = { title: "Top regulars — ride.bln analytics" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function RegularsPage() {
  const regulars = getTopRegulars(50);

  if (regulars.length === 0) {
    return (
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>Top regulars</h1>
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
        Top regulars
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "2rem" }}>
        Top {regulars.length} students by attended count.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "2.5rem" }}>#</th>
              <th>Name</th>
              <th>Attended</th>
              <th>First visit</th>
              <th>Last visit</th>
              <th>Fav location</th>
              <th>Fav day</th>
            </tr>
          </thead>
          <tbody>
            {regulars.map((c, i) => (
              <tr key={c.member_id} className="table-row-alt">
                <td className="col-muted col-number">{i + 1}</td>
                <td className="col-name">
                  <Link
                    href={`/customers/${c.member_id}`}
                    style={{ color: "var(--color-ink)", textDecorationColor: "var(--color-vista-blue)" }}
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="col-number" style={{ fontWeight: 500 }}>{c.attended}</td>
                <td className="col-muted">{c.first_visit ?? "—"}</td>
                <td className="col-muted">{c.last_visit ?? "—"}</td>
                <td className="col-muted">{c.fav_location ?? "—"}</td>
                <td className="col-muted">{c.fav_weekday != null ? DAYS[c.fav_weekday] : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
