import type { Counts } from "./queries";

// Everything on the Locations page is computed from one list of past classes,
// so the page filters (class name, location, dates) apply to every chart.
export interface PastClass extends Counts {
  id: number;
  name: string;
  local_date: string;
  local_time: string;
  weekday: number;
  location: string;
}

export interface LocationSummary extends Counts {
  location: string;
  classes: number;
  avg_per_class: number | null;
}

export interface MonthlyLocation extends Counts {
  location: string;
  month: string; // YYYY-MM
  classes: number;
}

export interface SlotPoint {
  weekday: number;
  local_time: string;
  classes: number;
  total_attended: number;
  avg_per_class: number;
}

const zero = (): Counts => ({ checked_in: 0, no_shows: 0, cancelled: 0, late_cancels: 0 });

function add(into: Counts, c: Counts): void {
  into.checked_in += c.checked_in;
  into.no_shows += c.no_shows;
  into.cancelled += c.cancelled;
  into.late_cancels += c.late_cancels;
}

export function avgPerClass(checkIns: number, classes: number): number | null {
  return classes > 0 ? Math.round((10 * checkIns) / classes) / 10 : null;
}

export function summarizeByLocation(rows: PastClass[]): LocationSummary[] {
  const map = new Map<string, Counts & { classes: number }>();
  for (const r of rows) {
    const s = map.get(r.location) ?? { ...zero(), classes: 0 };
    s.classes += 1;
    add(s, r);
    map.set(r.location, s);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([location, s]) => ({ location, ...s, avg_per_class: avgPerClass(s.checked_in, s.classes) }));
}

export function monthlyByLocation(rows: PastClass[]): MonthlyLocation[] {
  const map = new Map<string, MonthlyLocation>();
  for (const r of rows) {
    const month = r.local_date.slice(0, 7);
    const key = `${month}|${r.location}`;
    const m = map.get(key) ?? { location: r.location, month, classes: 0, ...zero() };
    m.classes += 1;
    add(m, r);
    map.set(key, m);
  }
  return [...map.values()].sort(
    (a, b) => a.month.localeCompare(b.month) || a.location.localeCompare(b.location),
  );
}

const slotKey = (r: { weekday: number; local_time: string }) => `${r.weekday}|${r.local_time}`;

/** Slots held at least `min` times. Decided on all past classes, so a short date range can't hide them. */
export function recurringSlots(allRows: PastClass[], min = 3): Set<string> {
  const counts = new Map<string, number>();
  for (const r of allRows) counts.set(slotKey(r), (counts.get(slotKey(r)) ?? 0) + 1);
  return new Set([...counts].filter(([, n]) => n >= min).map(([k]) => k));
}

export function slotAttendance(rows: PastClass[], recurring: Set<string>): SlotPoint[] {
  const map = new Map<string, SlotPoint>();
  for (const r of rows) {
    const key = slotKey(r);
    if (!recurring.has(key)) continue;
    const s = map.get(key) ?? { weekday: r.weekday, local_time: r.local_time, classes: 0, total_attended: 0, avg_per_class: 0 };
    s.classes += 1;
    s.total_attended += r.checked_in;
    map.set(key, s);
  }
  return [...map.values()]
    .map((s) => ({ ...s, avg_per_class: avgPerClass(s.total_attended, s.classes) ?? 0 }))
    .sort((a, b) => b.avg_per_class - a.avg_per_class);
}
