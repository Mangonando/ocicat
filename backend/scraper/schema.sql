PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS classes (
  id            INTEGER PRIMARY KEY,          -- Momence session id
  name          TEXT NOT NULL,
  starts_at_utc TEXT NOT NULL,                -- ISO 8601 UTC
  local_date    TEXT NOT NULL,                -- Europe/Berlin, YYYY-MM-DD
  local_time    TEXT NOT NULL,                -- Europe/Berlin, HH:MM
  weekday       INTEGER NOT NULL,             -- 0 = Monday
  duration_min  INTEGER,
  location_id   INTEGER,
  location      TEXT,
  teacher_id    INTEGER,
  capacity      INTEGER,
  is_cancelled  INTEGER NOT NULL DEFAULT 0,
  -- aggregate counts as Momence reports them (used to sanity-check our rows)
  m_signups     INTEGER, m_active INTEGER, m_cancelled INTEGER,
  m_checked_in  INTEGER, m_no_show INTEGER,
  scraped_at    TEXT NOT NULL,
  is_mine       INTEGER NOT NULL DEFAULT 1         -- 0 if subbed by another teacher
);

CREATE TABLE IF NOT EXISTS customers (
  member_id  INTEGER PRIMARY KEY,             -- Momence memberId
  name       TEXT NOT NULL,
  first_name TEXT,
  last_name  TEXT,
  updated_at TEXT NOT NULL
);

-- One row per booking (a person who brings friends has several rows, by design).
CREATE TABLE IF NOT EXISTS signups (
  booking_id    INTEGER PRIMARY KEY,          -- Momence booking id
  class_id      INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id     INTEGER NOT NULL REFERENCES customers(member_id),
  status        TEXT NOT NULL CHECK (status IN ('checked_in','no_show','cancelled','booked')),
  late_cancel   INTEGER NOT NULL DEFAULT 0,
  signed_up_at  TEXT,                         -- ISO UTC
  cancelled_at  TEXT,                         -- ISO UTC, only for cancelled
  spot          INTEGER,
  payment_mode  TEXT,
  prev_visits   INTEGER,
  scraped_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_signups_class  ON signups(class_id);
CREATE INDEX IF NOT EXISTS ix_signups_member ON signups(member_id);
CREATE INDEX IF NOT EXISTS ix_classes_date   ON classes(local_date);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT, finished_at TEXT, since TEXT,
  classes INTEGER, signups INTEGER, ok INTEGER, note TEXT
);

-- v_visits: one row per attended booking (use for per-customer visit history)
CREATE VIEW IF NOT EXISTS v_visits AS
SELECT s.booking_id, s.class_id, s.member_id,
       c.local_date, c.name AS class_name, c.location, c.weekday, c.is_mine
FROM signups s
JOIN classes c ON c.id = s.class_id
WHERE s.status = 'checked_in';

-- v_class_summary: aggregate counts per class derived from our own rows.
-- Friends bookings: a customer who brings friends creates one booking row per person —
-- intentional, so headcount = SUM(checked_in) is the true number of people in the room.
CREATE VIEW IF NOT EXISTS v_class_summary AS
SELECT c.id, c.local_date, c.local_time, c.weekday, c.name, c.location,
       c.is_mine, c.capacity, c.is_cancelled,
       SUM(s.status = 'checked_in') AS checked_in,
       SUM(s.status = 'no_show')    AS no_shows,
       SUM(s.status = 'cancelled')  AS cancelled,
       SUM(s.status = 'booked')     AS booked,
       COUNT(*)                     AS total_signups
FROM classes c
LEFT JOIN signups s ON s.class_id = c.id
GROUP BY c.id;

-- v_customer_stats: lifetime summary per customer
CREATE VIEW IF NOT EXISTS v_customer_stats AS
SELECT c.member_id, c.name,
  SUM(s.status='checked_in') AS attended,
  SUM(s.status='no_show')    AS no_shows,
  SUM(s.status='cancelled')  AS cancelled,
  SUM(s.late_cancel)         AS late_cancels,
  COUNT(*)                   AS signups,
  MIN(CASE WHEN s.status='checked_in' THEN k.local_date END) AS first_visit,
  MAX(CASE WHEN s.status='checked_in' THEN k.local_date END) AS last_visit
FROM customers c
JOIN signups s ON s.member_id = c.member_id
JOIN classes k ON k.id = s.class_id
GROUP BY c.member_id;
