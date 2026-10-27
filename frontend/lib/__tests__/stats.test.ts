import { describe, it, expect } from "vitest";
import {
  berlinToday, fmt, inRange, mondayOf, monthLabel, monthRange, pct, rangeLabel, shortDate, weekRange,
} from "../format";
import { outcomeOf, outcomeShares } from "../outcomes";
import { summarize } from "../overview";
import { applyClassFilters, type ClassFilterState } from "../filters";
import type { ClassAttendance } from "../queries";
import {
  monthlyByLocation, recurringSlots, slotAttendance, summarizeByLocation, type PastClass,
} from "../locations";

const ALL: ClassFilterState = { className: "", location: "", range: { from: "", to: "" } };

function cls(overrides: Partial<ClassAttendance>): ClassAttendance {
  return {
    id: 1,
    name: "latin ride",
    local_date: "2026-10-01",
    local_time: "19:00",
    location: "Studio A",
    total_bookings: 0,
    checked_in: 0,
    no_shows: 0,
    cancelled: 0,
    late_cancels: 0,
    booked: 0,
    attendance_rate: null,
    cancel_rate: null,
    member_ids: [],
    ...overrides,
  };
}

describe("format", () => {
  it("formats numbers the same way everywhere", () => {
    expect(fmt(1918)).toBe("1,918");
  });

  it("returns null for a percentage of nothing", () => {
    expect(pct(1, 0)).toBeNull();
    expect(pct(1, 3)).toBe(33);
  });

  it("labels dates, months and weeks", () => {
    expect(shortDate("2026-10-05")).toBe("5 Oct");
    expect(monthLabel("2026-11")).toBe("Nov 2026");
    expect(weekRange("2026-10-05")).toBe("5–11 Oct 2026");
    expect(weekRange("2026-09-28")).toBe("28 Sep – 4 Oct 2026");
  });

  it("uses the Berlin date, not UTC", () => {
    // 23:30 UTC on 31 Oct is already 1 Nov in Berlin (CET, UTC+1)
    expect(berlinToday(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11-01");
  });
});

describe("outcomes", () => {
  it("separates late cancels from early cancels", () => {
    expect(outcomeOf("cancelled", 0)).toBe("cancelled");
    expect(outcomeOf("cancelled", 1)).toBe("late_cancels");
    expect(outcomeOf("checked_in", 0)).toBe("checked_in");
    expect(outcomeOf("booked", 0)).toBeNull();
  });

  it("shares add up to 100 and missed is everything but attended", () => {
    const s = outcomeShares({ checked_in: 6, no_shows: 1, cancelled: 2, late_cancels: 1 });
    expect(s.checked_in! + s.no_shows! + s.cancelled! + s.late_cancels!).toBe(100);
    expect(s.missed).toBe(40);
  });

  it("returns null shares when there are no resolved bookings", () => {
    expect(outcomeShares({ checked_in: 0, no_shows: 0, cancelled: 0, late_cancels: 0 }).missed).toBeNull();
  });
});

describe("overview summary", () => {
  const rows = [
    cls({ id: 1, location: "Studio A", total_bookings: 10, checked_in: 7, no_shows: 1, cancelled: 1, late_cancels: 1, member_ids: [1, 2, 3] }),
    cls({ id: 2, name: "power ride", location: "Studio B", total_bookings: 5, booked: 5, member_ids: [3, 4] }),
  ];

  it("counts unique riders across classes", () => {
    expect(summarize(rows).riders).toBe(4);
  });

  it("computes the rates from the filtered rows", () => {
    const s = summarize(applyClassFilters(rows, { ...ALL, location: "Studio A" }));
    expect(s.classes).toBe(1);
    expect(s.checkInRate).toBe(88); // 7 / (7 + 1)
    expect(s.cancelRate).toBe(20); // (1 + 1) / 10
    expect(s.lateCancelRate).toBe(10);
  });

  it("filters by class name, ignoring case", () => {
    expect(applyClassFilters(rows, { ...ALL, className: "POWER" })).toHaveLength(1);
  });

  it("bookings equal the sum of every outcome plus still-booked", () => {
    const s = summarize(rows);
    expect(s.checked_in + s.no_shows + s.cancelled + s.late_cancels + s.booked).toBe(s.bookings);
  });
});

describe("date range", () => {
  it("builds whole-month presets, including across a year", () => {
    expect(monthRange("2026-10-27", 0)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(monthRange("2026-10-27", -1)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(monthRange("2026-01-15", -1)).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("includes both ends and treats empty ends as open", () => {
    const sep = { from: "2026-09-01", to: "2026-09-30" };
    expect(inRange("2026-09-01", sep)).toBe(true);
    expect(inRange("2026-09-30", sep)).toBe(true);
    expect(inRange("2026-10-01", sep)).toBe(false);
    expect(inRange("2020-01-01", { from: "", to: "" })).toBe(true);
  });

  it("labels the active range", () => {
    expect(rangeLabel({ from: "2026-09-01", to: "2026-09-30" })).toBe("1–30 Sep 2026");
    expect(rangeLabel({ from: "2026-09-28", to: "2026-10-04" })).toBe("28 Sep – 4 Oct 2026");
    expect(rangeLabel({ from: "", to: "" })).toBeNull();
  });

  it("finds the Monday of a week", () => {
    expect(mondayOf("2026-10-27")).toBe("2026-10-26"); // Tuesday
    expect(mondayOf("2026-10-26")).toBe("2026-10-26"); // Monday
    expect(mondayOf("2026-11-01")).toBe("2026-10-26"); // Sunday
  });

  it("filters Overview classes by date", () => {
    const rows = [cls({ id: 1, local_date: "2026-08-31" }), cls({ id: 2, local_date: "2026-09-15" })];
    expect(applyClassFilters(rows, { ...ALL, range: { from: "2026-09-01", to: "2026-09-30" } }).map((r) => r.id)).toEqual([2]);
  });
});

describe("locations", () => {
  const past = (o: Partial<PastClass>): PastClass => ({
    id: 1, name: "latin ride", local_date: "2026-09-01", local_time: "19:00", weekday: 0,
    location: "Studio A", checked_in: 0, no_shows: 0, cancelled: 0, late_cancels: 0, ...o,
  });
  const rows = [
    past({ id: 1, local_date: "2026-09-07", checked_in: 30 }),
    past({ id: 2, local_date: "2026-09-14", checked_in: 34 }),
    past({ id: 3, local_date: "2026-10-05", checked_in: 32, no_shows: 2 }),
    past({ id: 4, local_date: "2026-09-08", weekday: 1, local_time: "20:00", location: "Studio B", checked_in: 40 }),
  ];

  it("summarises per studio with avg per class", () => {
    const a = summarizeByLocation(rows).find((s) => s.location === "Studio A")!;
    expect(a.classes).toBe(3);
    expect(a.avg_per_class).toBe(32);
  });

  it("splits months per studio", () => {
    const m = monthlyByLocation(rows);
    expect(m.map((r) => `${r.month} ${r.location} ${r.classes}`)).toEqual([
      "2026-09 Studio A 2", "2026-09 Studio B 1", "2026-10 Studio A 1",
    ]);
  });

  it("keeps recurring slots even when the filtered range has fewer classes", () => {
    const recurring = recurringSlots(rows, 3); // Mon 19:00 has 3 classes overall, Tue 20:00 only 1
    const septOnly = rows.filter((r) => r.local_date < "2026-10-01");
    const slots = slotAttendance(septOnly, recurring);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ weekday: 0, classes: 2, avg_per_class: 32 });
  });
});
