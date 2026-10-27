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

  const statCards = [
    { label: "Attended",     value: stat.attended,     accent: "var(--color-chartreuse)" },
    { label: "No-shows",     value: stat.no_shows,     accent: stat.no_shows > 2 ? "var(--color-tomato)" : "var(--color-apricot)" },
    { label: "Cancelled",    value: stat.cancelled,    accent: "var(--color-vista-blue)" },
    { label: "Late cancels", value: stat.late_cancels, accent: "var(--color-apricot)" },
  ];

  return (
    <div style={{ maxWidth: "52rem", margin: "0 auto" }}>
      <Link
        href="/regulars"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          color: "var(--color-ink)",
          opacity: 0.55,
          textDecoration: "none",
          display: "inline-block",
          marginBottom: "1rem",
        }}
      >
        ← Back to regulars
      </Link>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          letterSpacing: "-0.01em",
          marginBottom: "0.375rem",
        }}
      >
        {stat.name}
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "2rem" }}>
        First visit: {stat.first_visit ?? "—"} · Last visit: {stat.last_visit ?? "—"}
      </p>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem",
          marginBottom: "2.5rem",
        }}
      >
        {statCards.map(({ label, value, accent }) => (
          <div
            key={label}
            style={{
              backgroundColor: accent,
              border: "2px solid var(--color-ink)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-sm)",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {value}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", marginTop: "0.25rem", opacity: 0.65 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Visit history */}
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          marginBottom: "0.75rem",
        }}
      >
        Visit history{" "}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-base)", opacity: 0.5, fontWeight: 400 }}>
          ({visits.length})
        </span>
      </h2>

      {visits.length === 0 ? (
        <p style={{ opacity: 0.45, fontFamily: "var(--font-mono)" }}>No visits on record.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Class</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.booking_id} className="table-row-alt">
                  <td className="col-muted">{v.local_date}</td>
                  <td className="col-muted">{DAYS[v.weekday]}</td>
                  <td className="col-name">
                    {v.class_name}
                    {!v.is_mine && (
                      <span style={{ marginLeft: "0.375rem", fontSize: "0.6875rem", opacity: 0.45 }}>
                        (sub)
                      </span>
                    )}
                  </td>
                  <td className="col-muted">{v.location ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
