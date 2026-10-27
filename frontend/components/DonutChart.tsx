"use client";

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  innerRatio?: number;
}

function describeDonutSlice(
  cx: number,
  cy: number,
  r: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const sx = cx + r * Math.sin(startAngle);
  const sy = cy - r * Math.cos(startAngle);
  const ex = cx + r * Math.sin(endAngle);
  const ey = cy - r * Math.cos(endAngle);
  const ix = cx + innerR * Math.sin(endAngle);
  const iy = cy - innerR * Math.cos(endAngle);
  const ix2 = cx + innerR * Math.sin(startAngle);
  const iy2 = cy - innerR * Math.cos(startAngle);
  return (
    `M ${sx} ${sy}` +
    ` A ${r} ${r} 0 ${large} 1 ${ex} ${ey}` +
    ` L ${ix} ${iy}` +
    ` A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2}` +
    ` Z`
  );
}

export default function DonutChart({ slices, size = 220, innerRatio = 0.55 }: Props) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const innerR = r * innerRatio;

  const paths = slices.map((slice, i) => {
    const startAngle = slices
      .slice(0, i)
      .reduce((acc, s) => acc + (s.value / total) * Math.PI * 2, 0);
    const endAngle = startAngle + (slice.value / total) * Math.PI * 2;
    const midAngle = (startAngle + endAngle) / 2;
    const labelR = r * 0.72;
    const lx = cx + labelR * Math.sin(midAngle);
    const ly = cy - labelR * Math.cos(midAngle);
    const pct = Math.round((slice.value / total) * 100);
    return { path: describeDonutSlice(cx, cy, r, innerR, startAngle, endAngle), midAngle, lx, ly, pct, ...slice };
  });

  return (
    <figure style={{ display: "inline-block", margin: 0 }} aria-label="Booking status breakdown">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Donut chart showing check-in, no-show, and cancellation split"
      >
        {paths.map((s) => (
          <path
            key={s.label}
            d={s.path}
            fill={s.color}
            stroke="var(--color-ink)"
            strokeWidth="2"
          />
        ))}
        {/* Centre total */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fill: "var(--color-ink)" }}
        >
          {total.toLocaleString()}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fill: "var(--color-ink)", opacity: 0.65 }}
        >
          bookings
        </text>
        {/* Percentage labels */}
        {paths.map((s) =>
          s.pct >= 6 ? (
            <text
              key={s.label + "-pct"}
              x={s.lx}
              y={s.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, fill: "var(--color-ink)" }}
            >
              {s.pct}%
            </text>
          ) : null,
        )}
      </svg>
      {/* Legend — colour must not be the only signal; labels are required */}
      <figcaption>
        <ul
          style={{
            listStyle: "none",
            margin: "0.75rem 0 0",
            padding: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem 1.25rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
          }}
        >
          {paths.map((s) => (
            <li key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  backgroundColor: s.color,
                  border: "1.5px solid var(--color-ink)",
                  borderRadius: "1px",
                  flexShrink: 0,
                }}
              />
              {s.label} — {s.value.toLocaleString()} ({Math.round((s.value / total) * 100)}%)
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
