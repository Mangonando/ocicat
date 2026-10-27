import Link from "next/link";

/** Small calendar glyph: the rider is booked for an upcoming class. */
function BookedMarker() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      role="img"
      aria-label="booked for an upcoming class"
      style={{ flexShrink: 0 }}
    >
      <rect x="1" y="2.5" width="12" height="10.5" rx="1" fill="var(--color-chartreuse)" stroke="var(--color-ink)" strokeWidth="1.5" />
      <rect x="1" y="2.5" width="12" height="3.5" fill="var(--color-ink)" />
      <line x1="4" y1="1" x2="4" y2="4" stroke="var(--color-ink)" strokeWidth="1.5" />
      <line x1="10" y1="1" x2="10" y2="4" stroke="var(--color-ink)" strokeWidth="1.5" />
    </svg>
  );
}

export function BookedLegend() {
  return (
    <p
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        opacity: 0.75,
        marginBottom: "1rem",
      }}
    >
      <BookedMarker /> = booked for an upcoming class (open the rider to see which)
    </p>
  );
}

/** Rider name linking to their detail page, with the booked marker when it applies. */
export default function RiderName({
  memberId,
  name,
  booked,
}: {
  memberId: number;
  name: string;
  booked: boolean;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
      <Link
        href={`/customers/${memberId}`}
        style={{ color: "var(--color-ink)", textDecorationColor: "var(--color-vista-blue)" }}
      >
        {name}
      </Link>
      {booked && <BookedMarker />}
    </span>
  );
}
