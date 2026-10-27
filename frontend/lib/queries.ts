import { getDb } from "./db";

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

export interface TopRegular extends CustomerStat {
  fav_location: string | null;
  fav_weekday: number | null;
}

export interface Visit {
  booking_id: number;
  class_id: number;
  local_date: string;
  class_name: string;
  location: string | null;
  weekday: number;
  is_mine: number;
}

export interface MonthlyLocation {
  location: string;
  month: string;
  headcount: number;
}

export interface LocationSummary {
  location: string;
  total_headcount: number;
  classes: number;
  avg_per_class: number;
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

export function getTopRegulars(limit = 50): TopRegular[] {
  try {
    return getDb()
      .prepare(
        `SELECT cs.member_id, cs.name, cs.attended, cs.no_shows, cs.cancelled,
          cs.late_cancels, cs.signups, cs.first_visit, cs.last_visit,
          (SELECT v.location FROM v_visits v
           WHERE v.member_id = cs.member_id AND v.location IS NOT NULL
           GROUP BY v.location ORDER BY COUNT(*) DESC LIMIT 1) AS fav_location,
          (SELECT v.weekday FROM v_visits v
           WHERE v.member_id = cs.member_id
           GROUP BY v.weekday ORDER BY COUNT(*) DESC LIMIT 1) AS fav_weekday
         FROM v_customer_stats cs
         WHERE cs.attended > 0
         ORDER BY cs.attended DESC
         LIMIT ?`,
      )
      .all(limit) as TopRegular[];
  } catch {
    return [];
  }
}

export function getReliabilityStats(minBookings = 3) {
  try {
    return getDb()
      .prepare(
        `SELECT member_id, name, signups, attended, no_shows, cancelled, late_cancels,
          ROUND(100.0 * no_shows / NULLIF(attended + no_shows, 0), 1) AS no_show_rate
         FROM v_customer_stats
         WHERE attended + no_shows >= ?
         ORDER BY no_show_rate DESC, no_shows DESC
         LIMIT 100`,
      )
      .all(minBookings) as (CustomerStat & { no_show_rate: number | null })[];
  } catch {
    return [];
  }
}

export function getMonthlyByLocation(): MonthlyLocation[] {
  try {
    return getDb()
      .prepare(
        `SELECT COALESCE(location, 'Unknown') AS location,
          strftime('%Y-%m', local_date) AS month,
          SUM(checked_in) AS headcount
         FROM v_class_summary
         WHERE is_mine = 1 AND is_cancelled = 0
         GROUP BY location, month
         ORDER BY month, location`,
      )
      .all() as MonthlyLocation[];
  } catch {
    return [];
  }
}

export function getLocationSummaries(): LocationSummary[] {
  try {
    return getDb()
      .prepare(
        `SELECT COALESCE(location, 'Unknown') AS location,
          SUM(checked_in) AS total_headcount,
          COUNT(*) AS classes,
          ROUND(1.0 * SUM(checked_in) / NULLIF(COUNT(*), 0), 1) AS avg_per_class
         FROM v_class_summary
         WHERE is_mine = 1 AND is_cancelled = 0
         GROUP BY location
         ORDER BY total_headcount DESC`,
      )
      .all() as LocationSummary[];
  } catch {
    return [];
  }
}

export function getCustomerVisits(memberId: number): Visit[] {
  try {
    return getDb()
      .prepare(
        `SELECT booking_id, class_id, local_date, class_name, location, weekday, is_mine
         FROM v_visits
         WHERE member_id = ?
         ORDER BY local_date DESC`,
      )
      .all(memberId) as Visit[];
  } catch {
    return [];
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

/* ── Summary stats for the dashboard home ────────────────────── */
export interface SummaryStats {
  total_classes: number;
  total_bookings: number;
  total_attended: number;
  total_no_shows: number;
  total_cancelled: number;
  unique_students: number;
}

export function getSummaryStats(): SummaryStats | null {
  try {
    return (
      getDb()
        .prepare(
          `SELECT
            COUNT(DISTINCT c.id)                                                AS total_classes,
            COUNT(s.booking_id)                                                 AS total_bookings,
            SUM(CASE WHEN s.status = 'checked_in' THEN 1 ELSE 0 END)           AS total_attended,
            SUM(CASE WHEN s.status = 'no_show'    THEN 1 ELSE 0 END)           AS total_no_shows,
            SUM(CASE WHEN s.status = 'cancelled'  THEN 1 ELSE 0 END)           AS total_cancelled,
            COUNT(DISTINCT s.member_id)                                         AS unique_students
           FROM signups s
           JOIN classes c ON c.id = s.class_id
           WHERE c.is_mine = 1 AND c.is_cancelled = 0`,
        )
        .get() as SummaryStats | undefined
    ) ?? null;
  } catch {
    return null;
  }
}

/* ── Weekly attendance (line chart) ──────────────────────────── */
export interface WeeklyPoint {
  week: string;
  week_start: string;
  attended: number;
}

export function getWeeklyAttendance(): WeeklyPoint[] {
  try {
    return getDb()
      .prepare(
        `SELECT
          strftime('%Y-W%W', c.local_date)                                    AS week,
          MIN(c.local_date)                                                   AS week_start,
          SUM(CASE WHEN s.status = 'checked_in' THEN 1 ELSE 0 END)           AS attended
         FROM signups s
         JOIN classes c ON c.id = s.class_id
         WHERE c.is_mine = 1 AND c.is_cancelled = 0
         GROUP BY week
         ORDER BY week
         LIMIT 52`,
      )
      .all() as WeeklyPoint[];
  } catch {
    return [];
  }
}

/* ── Attendance per slot (bar chart by weekday × time) ───────── */
export interface SlotPoint {
  weekday: number;
  local_time: string;
  classes: number;
  total_attended: number;
  avg_per_class: number;
}

export function getSlotAttendance(): SlotPoint[] {
  try {
    return getDb()
      .prepare(
        `SELECT
          c.weekday,
          c.local_time,
          COUNT(DISTINCT c.id)                                                AS classes,
          SUM(CASE WHEN s.status = 'checked_in' THEN 1 ELSE 0 END)           AS total_attended,
          ROUND(
            1.0 * SUM(CASE WHEN s.status = 'checked_in' THEN 1 ELSE 0 END)
            / NULLIF(COUNT(DISTINCT c.id), 0), 1)                            AS avg_per_class
         FROM signups s
         JOIN classes c ON c.id = s.class_id
         WHERE c.is_mine = 1 AND c.is_cancelled = 0
         GROUP BY c.weekday, c.local_time
         ORDER BY avg_per_class DESC`,
      )
      .all() as SlotPoint[];
  } catch {
    return [];
  }
}

/* ── Per-class attendance table ──────────────────────────────── */
export interface ClassAttendance {
  id: number;
  name: string;
  local_date: string;
  local_time: string;
  location: string | null;
  total_bookings: number;
  check_ins: number;
  no_shows: number;
  cancellations: number;
  attendance_rate: number | null;
}

export function getClassAttendance(limit = 200): ClassAttendance[] {
  try {
    return getDb()
      .prepare(
        `SELECT
          c.id,
          c.name,
          c.local_date,
          c.local_time,
          c.location,
          COUNT(s.booking_id)                                                       AS total_bookings,
          SUM(CASE WHEN s.status = 'checked_in' THEN 1 ELSE 0 END)                 AS check_ins,
          SUM(CASE WHEN s.status = 'no_show'    THEN 1 ELSE 0 END)                 AS no_shows,
          SUM(CASE WHEN s.status = 'cancelled'  THEN 1 ELSE 0 END)                 AS cancellations,
          ROUND(
            100.0 * SUM(CASE WHEN s.status = 'checked_in' THEN 1 ELSE 0 END) /
            NULLIF(SUM(CASE WHEN s.status IN ('checked_in','no_show') THEN 1 ELSE 0 END), 0),
            1)                                                                      AS attendance_rate
         FROM classes c
         LEFT JOIN signups s ON s.class_id = c.id
         WHERE c.is_mine = 1 AND c.is_cancelled = 0
         GROUP BY c.id
         ORDER BY c.local_date DESC, c.local_time DESC
         LIMIT ?`,
      )
      .all(limit) as ClassAttendance[];
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
