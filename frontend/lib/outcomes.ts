// How a booking ended. "cancelled" means an early cancel only; late cancels are
// counted separately, so the four outcomes never overlap and add up to 100%.
// The keys match the column names the queries return.
export interface Counts {
  checked_in: number;
  no_shows: number;
  cancelled: number;
  late_cancels: number;
}

export type Outcome = keyof Counts;

export const OUTCOMES: { key: Outcome; label: string; plural: string; color: string }[] = [
  { key: "checked_in", label: "Attended", plural: "Check-ins", color: "var(--color-status-attended)" },
  { key: "no_shows", label: "No-show", plural: "No-shows", color: "var(--color-status-no-show)" },
  { key: "cancelled", label: "Cancelled", plural: "Cancelled", color: "var(--color-status-cancelled)" },
  { key: "late_cancels", label: "Late cancel", plural: "Late cancels", color: "var(--color-status-late-cancel)" },
];

export const OUTCOME_BY_KEY = Object.fromEntries(OUTCOMES.map((o) => [o.key, o])) as Record<
  Outcome,
  (typeof OUTCOMES)[number]
>;

export const zeroCounts = (): Counts => ({ checked_in: 0, no_shows: 0, cancelled: 0, late_cancels: 0 });

export function totalOf(c: Counts): number {
  return c.checked_in + c.no_shows + c.cancelled + c.late_cancels;
}

/** Which outcome a signup row has, or null while it is still booked. */
export function outcomeOf(status: string, lateCancel: number): Outcome | null {
  if (status === "checked_in") return "checked_in";
  if (status === "no_show") return "no_shows";
  if (status === "cancelled") return lateCancel ? "late_cancels" : "cancelled";
  return null;
}

export type OutcomeShares = Record<Outcome | "missed", number | null>;

/** Each outcome as a % of resolved bookings (one decimal); missed = everything but attended. */
export function outcomeShares(c: Counts): OutcomeShares {
  const total = totalOf(c);
  const share = (n: number) => (total > 0 ? Math.round((1000 * n) / total) / 10 : null);
  return {
    checked_in: share(c.checked_in),
    no_shows: share(c.no_shows),
    cancelled: share(c.cancelled),
    late_cancels: share(c.late_cancels),
    missed: share(c.no_shows + c.cancelled + c.late_cancels),
  };
}

/** Donut slices for the four outcomes, in the shared outcome colours. */
export function outcomeSlices(c: Counts) {
  return OUTCOMES.map((o) => ({ label: o.plural, value: c[o.key], color: o.color }));
}
