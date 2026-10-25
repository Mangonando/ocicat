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
  scraped_at    TEXT NOT NULL
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

-- Handy views for the dashboards
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
