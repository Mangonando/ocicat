import { getDb } from "./db";
import type { PastClass } from "./locations";
import type { Counts } from "./outcomes";

// Outcome counts used across queries. Early and late cancels are kept apart so
// attended + no-shows + cancelled + late cancels = all resolved bookings.
const OUTCOME_SUMS = `
  SUM(CASE WHEN s.status = 'checked_in' THEN 1 ELSE 0 END)                       AS checked_in,
  SUM(CASE WHEN s.status = 'no_show'    THEN 1 ELSE 0 END)                       AS no_shows,
  SUM(CASE WHEN s.status = 'cancelled' AND s.late_cancel = 0 THEN 1 ELSE 0 END)  AS cancelled,
  SUM(CASE WHEN s.status = 'cancelled' AND s.late_cancel = 1 THEN 1 ELSE 0 END)  AS late_cancels`;

export interface CustomerStat {
  member_id: number;
  name: string;
  attended: number;
  no_shows: number;
  cancelled: number;
  late_cancels: number;
  signups: number;
  first_visit: string | null;
  last_visit: string | null;
}

export interface TopRegular {
  member_id: number;
  name: string;
  attended: number;
  first_visit: string | null;
  last_visit: string | null;
  fav_location: string | null;
  fav_weekday: number | null;
}

export function getAllCustomerStats(): CustomerStat[] {
  try {
    return getDb().prepare(
        `SELECT member_id, name, attended, no_shows, cancelled, late_cancels,
          signups, first_visit, last_visit
         FROM v_customer_stats
         WHERE attended > 0
         ORDER BY attended DESC`,
      )
      .all() as CustomerStat[];
  } catch {
    return [];
  }
}

export function getLocations(): string[] {
  try {
    return (
      getDb()
        .prepare(
          `SELECT DISTINCT location FROM classes
           WHERE location IS NOT NULL
           ORDER BY location`,
        )
        .all() as { location: string }[]
    ).map((r) => r.location);
  } catch {
    return [];
  }
}

/** Ranked by attended. With a location, only visits at that studio count. */
export function getTopRegulars(limit = 50, location: string | null = null): TopRegular[] {
  try {
    return getDb()
      .prepare(
        `SELECT v.member_id, cu.name,
          COUNT(*)          AS attended,
          MIN(v.local_date) AS first_visit,
          MAX(v.local_date) AS last_visit,
          (SELECT v2.location FROM v_visits v2
           WHERE v2.member_id = v.member_id AND v2.location IS NOT NULL
           GROUP BY v2.location ORDER BY COUNT(*) DESC LIMIT 1) AS fav_location,
          (SELECT v3.weekday FROM v_visits v3
           WHERE v3.member_id = v.member_id AND (:location IS NULL OR v3.location = :location)
           GROUP BY v3.weekday ORDER BY COUNT(*) DESC LIMIT 1) AS fav_weekday
         FROM v_visits v
         JOIN customers cu ON cu.member_id = v.member_id
         WHERE :location IS NULL OR v.location = :location
         GROUP BY v.member_id
         ORDER BY attended DESC, last_visit DESC
         LIMIT :limit`,
      )
      .all({ location, limit }) as TopRegular[];
  } catch {
    return [];
  }
}

export interface ReliabilityRow extends Counts {
  member_id: number;
  name: string;
}

/** Riders with at least `minResolved` bookings that have an outcome (not still booked). */
export function getReliabilityStats(minResolved = 3): ReliabilityRow[] {
  try {
    return getDb()
      .prepare(
        `SELECT cu.member_id, cu.name, ${OUTCOME_SUMS}
         FROM signups s
         JOIN customers cu ON cu.member_id = s.member_id
         WHERE s.status != 'booked'
         GROUP BY cu.member_id
         HAVING COUNT(*) >= ?`,
      )
      .all(minResolved) as ReliabilityRow[];
  } catch {
    return [];
  }
}

export interface CustomerBooking {
  booking_id: number;
  class_id: number;
  local_date: string;
  local_time: string;
  class_name: string;
  location: string | null;
  weekday: number;
  is_mine: number;
  status: string;
  late_cancel: number;
}

/** Every booking a rider made, whatever its outcome, newest first. */
export function getCustomerBookings(memberId: number): CustomerBooking[] {
  try {
    return getDb()
      .prepare(
        `SELECT s.booking_id, s.class_id, c.local_date, c.local_time, c.name AS class_name,
          c.location, c.weekday, c.is_mine, s.status, s.late_cancel
         FROM signups s
         JOIN classes c ON c.id = s.class_id
         WHERE s.member_id = ? AND c.is_cancelled = 0
         ORDER BY c.local_date DESC, c.local_time DESC`,
      )
      .all(memberId) as CustomerBooking[];
  } catch {
    return [];
  }
}

/** Riders with at least one booking for a class today or later. */
export function getUpcomingMemberIds(today: string): Set<number> {
  try {
    const rows = getDb()
      .prepare(
        `SELECT DISTINCT s.member_id
         FROM signups s
         JOIN classes c ON c.id = s.class_id
         WHERE c.local_date >= ? AND c.is_cancelled = 0 AND s.status = 'booked'`,
      )
      .all(today) as { member_id: number }[];
    return new Set(rows.map((r) => r.member_id));
  } catch {
    return new Set();
  }
}

export interface UpcomingBooking {
  class_id: number;
  class_name: string;
  local_date: string;
  local_time: string;
  location: string | null;
  weekday: number;
  capacity: number | null;
  member_id: number;
  customer_name: string;
  attended: number;
  last_visit: string | null;
}

export function getUpcomingBookings(from: string, to: string): UpcomingBooking[] {
  try {
    return getDb()
      .prepare(
        `SELECT c.id AS class_id, c.name AS class_name, c.local_date, c.local_time,
          c.location, c.weekday, c.capacity,
          cu.member_id, cu.name AS customer_name,
          COALESCE(cs.attended, 0) AS attended,
          cs.last_visit
         FROM classes c
         JOIN signups s ON s.class_id = c.id
         JOIN customers cu ON cu.member_id = s.member_id
         LEFT JOIN v_customer_stats cs ON cs.member_id = cu.member_id
         WHERE c.local_date >= ? AND c.local_date <= ?
           AND c.is_mine = 1
           AND c.is_cancelled = 0
           AND s.status = 'booked'
         ORDER BY c.local_date, c.local_time, c.location, cu.name`,
      )
      .all(from, to) as UpcomingBooking[];
  } catch {
    return [];
  }
}

/* ── Past classes (Locations page computes every chart from these) ── */
// Past only: upcoming classes have no check-ins yet and would read as zeros.
export function getPastClasses(today: string): PastClass[] {
  try {
    return getDb()
      .prepare(
        `SELECT c.id, c.name, c.local_date, c.local_time, c.weekday,
          COALESCE(c.location, 'Unknown') AS location,
          ${OUTCOME_SUMS}
         FROM classes c
         LEFT JOIN signups s ON s.class_id = c.id
         WHERE c.is_mine = 1 AND c.is_cancelled = 0 AND c.local_date < ?
         GROUP BY c.id
         ORDER BY c.local_date, c.local_time`,
      )
      .all(today) as PastClass[];
  } catch {
    return [];
  }
}

/* ── Per-class attendance (Overview table, tiles and donut) ──── */
export interface ClassAttendance extends Counts {
  id: number;
  name: string;
  local_date: string;
  local_time: string;
  location: string | null;
  total_bookings: number;
  booked: number; // not resolved yet (upcoming classes)
  attendance_rate: number | null;
  cancel_rate: number | null; // all cancels ÷ bookings
  member_ids: number[]; // to count unique riders for any filter; ids only, no names
}

export function getClassAttendance(): ClassAttendance[] {
  try {
    const rows = getDb()
      .prepare(
        `SELECT
          c.id,
          c.name,
          c.local_date,
          c.local_time,
          c.location,
          COUNT(s.booking_id)                                                       AS total_bookings,
          ${OUTCOME_SUMS},
          SUM(CASE WHEN s.status = 'booked'     THEN 1 ELSE 0 END)                 AS booked,
          ROUND(
            100.0 * SUM(CASE WHEN s.status = 'checked_in' THEN 1 ELSE 0 END) /
            NULLIF(SUM(CASE WHEN s.status IN ('checked_in','no_show') THEN 1 ELSE 0 END), 0),
            1)                                                                      AS attendance_rate,
          ROUND(
            100.0 * SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) /
            NULLIF(COUNT(s.booking_id), 0),
            1)                                                                      AS cancel_rate,
          GROUP_CONCAT(DISTINCT s.member_id)                                        AS member_ids
         FROM classes c
         LEFT JOIN signups s ON s.class_id = c.id
         WHERE c.is_mine = 1 AND c.is_cancelled = 0
         GROUP BY c.id
         ORDER BY c.local_date DESC, c.local_time DESC`,
      )
      .all() as (Omit<ClassAttendance, "member_ids"> & { member_ids: string | null })[];
    return rows.map((r) => ({
      ...r,
      member_ids: r.member_ids ? r.member_ids.split(",").map(Number) : [],
    }));
  } catch {
    return [];
  }
}

export function getCustomerStat(memberId: number): CustomerStat | null {
  try {
    return (
      (getDb()
        .prepare(
          `SELECT member_id, name, attended, no_shows, cancelled, late_cancels,
            signups, first_visit, last_visit
           FROM v_customer_stats
           WHERE member_id = ?`,
        )
        .get(memberId) as CustomerStat | undefined) ?? null
    );
  } catch {
    return null;
  }
}
