import { getAllCustomerStats } from "@/lib/queries";
import { isLapsed, isOneAndDone } from "@/lib/tiers";
import Link from "next/link";

export const metadata = { title: "Lapsed — ride.bln analytics" };

export default async function LapsedPage() {
  const { connection } = await import("next/server");
  await connection();

  const stats = getAllCustomerStats();
  const today = new Date();
  const oneAndDone = stats.filter((s) => isOneAndDone(s.attended, s.last_visit, today));
  const lapsed = stats.filter((s) => isLapsed(s.attended, s.last_visit, today));

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
        Lapsed students
      </h1>

      <section style={{ marginBottom: "2.5rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            marginBottom: "0.25rem",
          }}
        >
          One-and-done{" "}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-base)",
              opacity: 0.55,
              fontWeight: 400,
            }}
          >
            ({oneAndDone.length})
          </span>
        </h2>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "1rem" }}>
          Came 1–2×, last visit more than 30 days ago.
        </p>
        {oneAndDone.length === 0 ? (
          <p style={{ opacity: 0.45, fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
            None right now — great sign.
          </p>
        ) : (
          <CustomerTable rows={oneAndDone} />
        )}
      </section>

      <section>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            marginBottom: "0.25rem",
          }}
        >
          Lapsed{" "}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-base)",
              opacity: 0.55,
              fontWeight: 400,
            }}
          >
            ({lapsed.length})
          </span>
        </h2>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55, marginBottom: "1rem" }}>
          5+ visits but absent more than 28 days.
        </p>
        {lapsed.length === 0 ? (
          <p style={{ opacity: 0.45, fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
            No one lapsed. Keep it up.
          </p>
        ) : (
          <CustomerTable rows={lapsed} />
        )}
      </section>
    </div>
  );
}

function CustomerTable({ rows }: { rows: ReturnType<typeof getAllCustomerStats> }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Attended</th>
            <th>First visit</th>
            <th>Last visit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.member_id} className="table-row-alt">
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
              <td
                className="col-muted"
                style={{ color: "var(--color-tomato)" }}
              >
                {c.last_visit ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
