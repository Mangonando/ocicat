import { describe, it, expect } from "vitest";
import { getTier, isLapsed, isOneAndDone } from "../tiers";

describe("getTier", () => {
  it("classifies 1 visit as 1×", () => {
    expect(getTier(1).label).toBe("1×");
  });

  it("classifies 2 visits as 2×", () => {
    expect(getTier(2).label).toBe("2×");
  });

  it("classifies 3 visits as 3–5×", () => {
    expect(getTier(3).label).toBe("3–5×");
    expect(getTier(5).label).toBe("3–5×");
  });

  it("classifies 6–10 visits correctly", () => {
    expect(getTier(6).label).toBe("6–10×");
    expect(getTier(10).label).toBe("6–10×");
  });

  it("classifies 11–20 visits correctly", () => {
    expect(getTier(11).label).toBe("11–20×");
    expect(getTier(20).label).toBe("11–20×");
  });

  it("classifies 21+ visits as 20×+", () => {
    expect(getTier(21).label).toBe("20×+");
    expect(getTier(100).label).toBe("20×+");
  });
});

describe("isOneAndDone", () => {
  const today = new Date("2026-10-26");

  it("returns true for 1 visit, 60 days ago", () => {
    expect(isOneAndDone(1, "2026-08-27", today)).toBe(true);
  });

  it("returns false for 1 visit but only 10 days ago", () => {
    expect(isOneAndDone(1, "2026-10-16", today)).toBe(false);
  });

  it("returns true for 2 visits, 45 days ago", () => {
    expect(isOneAndDone(2, "2026-09-11", today)).toBe(true);
  });

  it("returns false for 3 visits (not one-and-done)", () => {
    expect(isOneAndDone(3, "2026-08-01", today)).toBe(false);
  });

  it("returns false for null lastVisit", () => {
    expect(isOneAndDone(1, null, today)).toBe(false);
  });
});

describe("isLapsed", () => {
  const today = new Date("2026-10-26");

  it("returns true for 5 visits, absent 35 days", () => {
    expect(isLapsed(5, "2026-09-21", today)).toBe(true);
  });

  it("returns false for 5 visits, only 14 days ago", () => {
    expect(isLapsed(5, "2026-10-12", today)).toBe(false);
  });

  it("returns false for fewer than 5 visits", () => {
    expect(isLapsed(4, "2026-09-01", today)).toBe(false);
  });

  it("returns false for null lastVisit", () => {
    expect(isLapsed(10, null, today)).toBe(false);
  });

  it("boundary: exactly 28 days is not lapsed", () => {
    expect(isLapsed(6, "2026-09-28", today)).toBe(false);
  });

  it("boundary: 29 days is lapsed", () => {
    expect(isLapsed(6, "2026-09-27", today)).toBe(true);
  });
});
