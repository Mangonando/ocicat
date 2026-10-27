import type { CSSProperties, ReactNode } from "react";

// Small layout pieces every page shares.

export function Page({ children, width = "72rem" }: { children: ReactNode; width?: string }) {
  return <div style={{ maxWidth: width, margin: "0 auto" }}>{children}</div>;
}

export function PageHeader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <header style={{ marginBottom: "1.5rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          letterSpacing: "-0.01em",
          marginBottom: children ? "0.25rem" : 0,
        }}
      >
        {title}
      </h1>
      {children && <p style={{ ...NOTE, maxWidth: "48rem" }}>{children}</p>}
    </header>
  );
}

/** Shown instead of a page body when the database has nothing for it yet. */
export function EmptyState({ title }: { title: string }) {
  return (
    <Page width="56rem">
      <PageHeader title={title}>
        No data yet. Run <code>python scrape.py</code> to populate the database.
      </PageHeader>
    </Page>
  );
}

export function SectionTitle({
  children,
  count,
  style,
}: {
  children: ReactNode;
  count?: number;
  style?: CSSProperties;
}) {
  return (
    <h2 style={{ ...H2, ...style }}>
      {children}
      {count != null && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-base)", opacity: 0.5, fontWeight: 400 }}>
          {" "}({count})
        </span>
      )}
    </h2>
  );
}

/** Coloured square + label, used in legends. */
export function Swatch({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
      <span className="swatch" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

export function Legend({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem 1.25rem",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const H2: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--text-lg)",
  marginBottom: "0.75rem",
};

/** Small muted caption text under titles and charts. */
export const NOTE: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  color: "var(--color-ink)",
  opacity: 0.55,
};
