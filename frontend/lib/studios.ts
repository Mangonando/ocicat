// Each studio keeps the same colour on every chart and card.
const STUDIO_COLORS: Record<string, string> = {
  "Studio Prenzlauer Berg": "var(--color-chartreuse)",
  "Studio Charlottenburg": "var(--color-vista-blue)",
};

export function studioColor(location: string | null): string {
  return (location && STUDIO_COLORS[location]) || "var(--color-tomato)";
}

/** "Studio Prenzlauer Berg" → "Prenzlauer Berg" for tight spaces. */
export function studioShort(location: string | null): string {
  return location ? location.replace(/^Studio\s+/, "") : "Unknown";
}
