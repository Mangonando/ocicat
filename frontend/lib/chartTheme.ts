import type { CSSProperties } from "react";

// Shared Recharts styling: apricot text on the ink chart panel.

export const AXIS_TICK = {
  fontSize: 11,
  fill: "var(--color-apricot)",
  fontFamily: "var(--font-mono)",
  opacity: 0.7,
};

export const AXIS_LINE = { stroke: "var(--color-apricot)", strokeOpacity: 0.2 };

export const TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "var(--color-ink)",
  border: "2px solid var(--color-chartreuse)",
  borderRadius: "var(--radius)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  color: "var(--color-apricot)",
};

/** The ink panel every chart sits in. */
export const CHART_PANEL: CSSProperties = {
  backgroundColor: "var(--color-ink)",
  border: "2px solid var(--color-ink)",
  borderRadius: "var(--radius)",
  padding: "1.25rem 1rem 0.5rem",
  boxShadow: "var(--shadow-md)",
};
