// One number format for the whole dashboard, so server- and client-rendered
// numbers look the same ("1,918" everywhere, never "1.918").
const NUMBER = new Intl.NumberFormat("en-US");

export function fmt(n: number): string {
  return NUMBER.format(n);
}

/** Percentage rounded to a whole number, or null when the denominator is 0. */
export function pct(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((100 * part) / whole) : null;
}

export function fmtPct(value: number | null): string {
  return value != null ? `${value}%` : "—";
}

/** Today's date in Berlin as YYYY-MM-DD (class dates are stored in local time). */
export function berlinToday(now = new Date()): string {
  return now.toLocaleDateString("sv", { timeZone: "Europe/Berlin" }).slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-05" → "5 Oct" */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "2026-10" → "Oct 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Monday "2026-10-05" → "5–11 Oct 2026" (or "28 Sep – 4 Oct 2026" across months). */
export function weekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00Z");
  const end = new Date(start.getTime() + 6 * 86_400_000);
  const sd = start.getUTCDate();
  const ed = end.getUTCDate();
  const sm = MONTHS[start.getUTCMonth()];
  const em = MONTHS[end.getUTCMonth()];
  const year = end.getUTCFullYear();
  return sm === em ? `${sd}–${ed} ${em} ${year}` : `${sd} ${sm} – ${ed} ${em} ${year}`;
}

/** Monday of the week containing `iso` (YYYY-MM-DD). */
export function mondayOf(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const offset = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(d.getTime() - offset * 86_400_000).toISOString().slice(0, 10);
}

/* ── Date range filter ───────────────────────────────────────── */
export interface DateRange {
  from: string; // YYYY-MM-DD, "" = open
  to: string;
}

export const ALL_TIME: DateRange = { from: "", to: "" };

export function inRange(iso: string, r: DateRange): boolean {
  return (!r.from || iso >= r.from) && (!r.to || iso <= r.to);
}

/** Whole calendar month around `today`, shifted by `offset` months (0 = this month, -1 = last). */
export function monthRange(today: string, offset = 0): DateRange {
  const [y, m] = today.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + offset, 1));
  const last = new Date(Date.UTC(y, m + offset, 0));
  return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
}

/** "1–30 Sep 2026", "28 Sep – 4 Oct 2026", "from 1 Sep 2026", or null for all time. */
export function rangeLabel(r: DateRange): string | null {
  const full = (iso: string) => `${shortDate(iso)} ${iso.slice(0, 4)}`;
  if (!r.from && !r.to) return null;
  if (!r.to) return `from ${full(r.from)}`;
  if (!r.from) return `until ${full(r.to)}`;
  if (r.from.slice(0, 7) === r.to.slice(0, 7)) {
    return `${Number(r.from.slice(8))}–${full(r.to)}`;
  }
  return r.from.slice(0, 4) === r.to.slice(0, 4)
    ? `${shortDate(r.from)} – ${full(r.to)}`
    : `${full(r.from)} – ${full(r.to)}`;
}
