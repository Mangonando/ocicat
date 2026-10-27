import { connection } from "next/server";
import { getCustomerStat, getCustomerBookings, type CustomerBooking } from "@/lib/queries";
import { berlinToday } from "@/lib/format";
import { OUTCOMES, OUTCOME_BY_KEY, outcomeOf } from "@/lib/outcomes";
import { studioShort } from "@/lib/studios";
import { notFound } from "next/navigation";
import Link from "next/link";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Reads the database and "today" on every request, so navigation may wait for the server.
export const instant = false;

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId) || memberId <= 0) notFound();

  const stat = getCustomerStat(memberId);
  if (!stat) notFound();

  const today = berlinToday();
  const bookings = getCustomerBookings(memberId);
  const upcoming = bookings
    .filter((b) => b.status === "booked" && b.local_date >= today)
    .reverse(); // soonest first
  const history = bookings.filter((b) => !(b.status === "booked" && b.local_date >= today));

  // Counted from the same rows as the history table, so the numbers always match it.
  const counts = { attended: 0, no_show: 0, cancelled: 0, late_cancel: 0 };
  for (const b of history) {
    const outcome = outcomeOf(b.status, b.late_cancel);
    if (outcome) counts[outcome] += 1;
  }

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

      {/* Counts per outcome — the colours double as the legend for the history below */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "0.75rem",
          marginBottom: "2.5rem",
        }}
      >
        {OUTCOMES.map(({ key, label, color }) => (
          <div
            key={key}
            style={{
              backgroundColor: color,
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
              {counts[key]}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", marginTop: "0.25rem", opacity: 0.75 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      <SectionTitle title="Upcoming" count={upcoming.length} />
      {upcoming.length === 0 ? (
        <p style={{ opacity: 0.45, fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", marginBottom: "2.5rem" }}>
          Not booked for any upcoming class.
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: "2.5rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Time</th>
                <th>Class</th>
                <th>Studio</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((b) => (
                <tr key={b.booking_id} className="table-row-alt">
                  <td className="col-muted">{b.local_date}</td>
                  <td className="col-muted">{DAYS[b.weekday]}</td>
                  <td className="col-muted">{b.local_time.slice(0, 5)}</td>
                  <td className="col-name">
                    <ClassName booking={b} />
                  </td>
                  <td className="col-muted">{studioShort(b.location)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking history: every outcome, not just attendances */}
      <SectionTitle title="Booking history" count={history.length} />
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "0.5rem" }}>
        {counts.attended} attended · {counts.no_show} no-show{counts.no_show !== 1 ? "s" : ""} ·{" "}
        {counts.cancelled} cancelled · {counts.late_cancel} late cancel{counts.late_cancel !== 1 ? "s" : ""}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem 1.25rem",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          marginBottom: "0.75rem",
        }}
      >
        {OUTCOMES.filter((o) => o.key !== "attended").map((o) => (
          <span key={o.key} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span className="swatch" style={{ backgroundColor: o.color }} />
            {o.label}
          </span>
        ))}
        <span style={{ opacity: 0.6 }}>Unmarked rows = attended</span>
      </div>

      {history.length === 0 ? (
        <p style={{ opacity: 0.45, fontFamily: "var(--font-mono)" }}>No bookings on record.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Class</th>
                <th>Studio</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {history.map((b) => {
                const outcome = outcomeOf(b.status, b.late_cancel);
                const color = outcome && outcome !== "attended" ? OUTCOME_BY_KEY[outcome].color : null;
                const cellStyle = color
                  ? { backgroundColor: `color-mix(in srgb, ${color} 35%, var(--color-apricot))` }
                  : undefined;
                return (
                  <tr key={b.booking_id} className={color ? undefined : "table-row-alt"}>
                    <td className="col-muted" style={cellStyle}>{b.local_date}</td>
                    <td className="col-muted" style={cellStyle}>{DAYS[b.weekday]}</td>
                    <td className="col-name" style={cellStyle}>
                      <ClassName booking={b} />
                    </td>
                    <td className="col-muted" style={cellStyle}>{studioShort(b.location)}</td>
                    <td style={cellStyle}>
                      {outcome === "attended" || outcome == null ? (
                        <span style={{ fontSize: "var(--text-xs)", opacity: 0.6 }}>
                          {outcome == null ? "Booked" : "Attended"}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-xs)",
                            fontWeight: 500,
                            backgroundColor: color!,
                            border: "1px solid var(--color-ink)",
                            borderRadius: "var(--radius)",
                            padding: "1px 6px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {OUTCOME_BY_KEY[outcome].label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "var(--text-lg)",
        marginBottom: "0.75rem",
      }}
    >
      {title}{" "}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-base)", opacity: 0.5, fontWeight: 400 }}>
        ({count})
      </span>
    </h2>
  );
}

function ClassName({ booking }: { booking: CustomerBooking }) {
  return (
    <>
      {booking.class_name}
      {!booking.is_mine && (
        <span style={{ marginLeft: "0.375rem", fontSize: "0.6875rem", opacity: 0.45 }}>
          (sub)
        </span>
      )}
    </>
  );
}
