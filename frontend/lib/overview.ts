import type { ClassAttendance } from "./queries";
import { pct } from "./format";

export interface OverviewSummary {
  classes: number;
  bookings: number;
  riders: number;
  check_ins: number;
  no_shows: number;
  cancelled: number;
  late_cancels: number;
  booked: number;
  checkInRate: number | null; // check-ins ÷ (check-ins + no-shows)
  noShowRate: number | null; // no-shows ÷ (check-ins + no-shows)
  cancelRate: number | null; // all cancels (early + late) ÷ bookings
  lateCancelRate: number | null; // late cancels ÷ bookings
}

export function summarize(rows: ClassAttendance[]): OverviewSummary {
  const riders = new Set<number>();
  const s = { bookings: 0, check_ins: 0, no_shows: 0, cancelled: 0, late_cancels: 0, booked: 0 };
  for (const r of rows) {
    s.bookings += r.total_bookings;
    s.check_ins += r.check_ins;
    s.no_shows += r.no_shows;
    s.cancelled += r.cancellations;
    s.late_cancels += r.late_cancels;
    s.booked += r.booked;
    for (const id of r.member_ids) riders.add(id);
  }
  const showed = s.check_ins + s.no_shows;
  return {
    classes: rows.length,
    riders: riders.size,
    ...s,
    checkInRate: pct(s.check_ins, showed),
    noShowRate: pct(s.no_shows, showed),
    cancelRate: pct(s.cancelled + s.late_cancels, s.bookings),
    lateCancelRate: pct(s.late_cancels, s.bookings),
  };
}
