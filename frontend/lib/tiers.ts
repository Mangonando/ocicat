export const TIERS = [
  { label: "20×+", min: 21, max: Infinity, color: "#1d4ed8" },
  { label: "11–20×", min: 11, max: 20, color: "#2563eb" },
  { label: "6–10×", min: 6, max: 10, color: "#3b82f6" },
  { label: "3–5×", min: 3, max: 5, color: "#60a5fa" },
  { label: "2×", min: 2, max: 2, color: "#93c5fd" },
  { label: "1×", min: 1, max: 1, color: "#bfdbfe" },
] as const;

export type Tier = (typeof TIERS)[number];

export function getTier(attended: number): Tier {
  return (
    TIERS.find(
      (t) => attended >= t.min && (t.max === Infinity || attended <= t.max),
    ) ?? TIERS[TIERS.length - 1]
  );
}

export function isLapsed(
  attended: number,
  lastVisit: string | null,
  today = new Date(),
): boolean {
  if (!lastVisit || attended < 5) return false;
  const daysSince =
    (today.getTime() - new Date(lastVisit).getTime()) / 86_400_000;
  return daysSince > 28;
}

export function isOneAndDone(
  attended: number,
  lastVisit: string | null,
  today = new Date(),
): boolean {
  if (!lastVisit || attended > 2) return false;
  const daysSince =
    (today.getTime() - new Date(lastVisit).getTime()) / 86_400_000;
  return daysSince > 30;
}
