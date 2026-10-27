import type { ClassAttendance } from "./queries";
import { pct } from "./format";
import { zeroCounts, type Counts } from "./outcomes";

export interface OverviewSummary extends Counts {
  classes: number;
  bookings: number;
  riders: number;
  booked: number;
  checkInRate: number | null; // check-ins ÷ (check-ins + no-shows)
  noShowRate: number | null; // no-shows ÷ (check-ins + no-shows)
  cancelRate: number | null; // all cancels (early + late) ÷ bookings
  lateCancelRate: number | null; // late cancels ÷ bookings
}

export function summarize(rows: ClassAttendance[]): OverviewSummary {
  const riders = new Set<number>();
  const s = { bookings: 0, booked: 0, ...zeroCounts() };
  for (const r of rows) {
    s.bookings += r.total_bookings;
    s.checked_in += r.checked_in;
    s.no_shows += r.no_shows;
    s.cancelled += r.cancelled;
    s.late_cancels += r.late_cancels;
    s.booked += r.booked;
    for (const id of r.member_ids) riders.add(id);
  }
  const showed = s.checked_in + s.no_shows;
  return {
    classes: rows.length,
    riders: riders.size,
    ...s,
    checkInRate: pct(s.checked_in, showed),
    noShowRate: pct(s.no_shows, showed),
    cancelRate: pct(s.cancelled + s.late_cancels, s.bookings),
    lateCancelRate: pct(s.late_cancels, s.bookings),
  };
}
