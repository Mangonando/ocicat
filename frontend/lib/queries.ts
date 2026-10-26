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
