-- v_visits: one row per attended booking (use for per-customer visit history)
CREATE VIEW IF NOT EXISTS v_visits AS
SELECT s.booking_id, s.class_id, s.member_id,
       c.local_date, c.name AS class_name, c.location, c.weekday, c.is_mine
FROM signups s
JOIN classes c ON c.id = s.class_id
WHERE s.status = 'checked_in';

-- v_class_summary: aggregate counts per class, derived from our own rows
-- Friends bookings: a customer who brings friends creates one booking row per person,
-- so headcount = SUM(checked_in) which is intentional and correct.
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
