// How a booking ended. "cancelled" means an early cancel only; late cancels are
// counted separately, so the four outcomes never overlap and add up to 100%.
export type Outcome = "attended" | "no_show" | "cancelled" | "late_cancel";

export const OUTCOMES: { key: Outcome; label: string; color: string }[] = [
  { key: "attended", label: "Attended", color: "var(--color-status-attended)" },
  { key: "no_show", label: "No-show", color: "var(--color-status-no-show)" },
  { key: "cancelled", label: "Cancelled", color: "var(--color-status-cancelled)" },
  { key: "late_cancel", label: "Late cancel", color: "var(--color-status-late-cancel)" },
];

export const OUTCOME_BY_KEY = Object.fromEntries(OUTCOMES.map((o) => [o.key, o])) as Record<
  Outcome,
  (typeof OUTCOMES)[number]
>;

export function outcomeOf(status: string, lateCancel: number): Outcome | null {
  if (status === "checked_in") return "attended";
  if (status === "no_show") return "no_show";
  if (status === "cancelled") return lateCancel ? "late_cancel" : "cancelled";
  return null; // still booked: not resolved yet
}

export interface OutcomeCounts {
  attended: number;
  no_show: number;
  cancelled: number;
  late_cancel: number;
}

export type OutcomeShares = Record<Outcome | "missed", number | null>;

/** Each outcome as a whole-number % of resolved bookings; missed = everything but attended. */
export function outcomeShares(c: OutcomeCounts): OutcomeShares {
  const total = c.attended + c.no_show + c.cancelled + c.late_cancel;
  const share = (n: number) => (total > 0 ? Math.round((1000 * n) / total) / 10 : null);
  return {
    attended: share(c.attended),
    no_show: share(c.no_show),
    cancelled: share(c.cancelled),
    late_cancel: share(c.late_cancel),
    missed: share(c.no_show + c.cancelled + c.late_cancel),
  };
}
