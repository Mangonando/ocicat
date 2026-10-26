"""Pull classes + bookings from Momence into SQLite. Idempotent: safe to re-run any time."""
import argparse, sqlite3, subprocess, sys
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from config import (DB_PATH, DEFAULT_LOOKBACK_DAYS, HOST_ID, ROOT, TEACHER_ID, TZ)
from migrate import run as run_migrations
from sources import AuthError, HarSource, LiveSource

PAGE = 20
SKIP_IF_RAN_WITHIN_DAYS = 6


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB_PATH)
    db.executescript((ROOT / "scraper" / "schema.sql").read_text())
    run_migrations(db)
    return db


def list_sessions(src, since, until):
    """Newest first; stop once we pass `since`. page is 0-based."""
    page = 0
    while True:
        j = src.get(f"/readonly/host/{HOST_ID}/sessions", {
            "sortBy": "startsAt", "sortOrder": "DESC", "dateTo": until.isoformat().replace("+00:00", "Z"),
            "page": page, "pageSize": PAGE, "status[]": ["published", "unpublished"],
            "timeZone": TZ, "grouped": "false"})
        items = j["payload"]
        for s in items:
            if datetime.fromisoformat(s["startsAt"].replace("Z", "+00:00")) < since:
                return
            yield s
        pag = j["pagination"]
        if not items or (page + 1) * PAGE >= pag["totalCount"]:
            return
        page += 1


def all_bookings(src, path, extra=None):
    page, out = 0, []
    while True:
        j = src.get(path, {"page": page, "pageSize": 80, "query": "", **(extra or {})})
        out += j["payload"]
        if (page + 1) * 80 >= j["pagination"]["totalCount"] or not j["payload"]:
            return out
        page += 1


def status_of(b, class_ended):
    if b.get("deletedAt"):
        return "cancelled"
    if b.get("checkedIn"):
        return "checked_in"
    return "no_show" if class_ended else "booked"


def save_class(db, s, counts, ts):
    start = datetime.fromisoformat(s["startsAt"].replace("Z", "+00:00"))
    local = start.astimezone(ZoneInfo(TZ))
    is_mine = int(s.get("teacherId") == TEACHER_ID)
    db.execute("""INSERT INTO classes
        (id, name, starts_at_utc, local_date, local_time, weekday, duration_min,
         location_id, location, teacher_id, capacity, is_cancelled,
         m_signups, m_active, m_cancelled, m_checked_in, m_no_show, is_mine, scraped_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, starts_at_utc=excluded.starts_at_utc,
      local_date=excluded.local_date, local_time=excluded.local_time, weekday=excluded.weekday,
      duration_min=excluded.duration_min, location_id=excluded.location_id, location=excluded.location,
      teacher_id=excluded.teacher_id, capacity=excluded.capacity, is_cancelled=excluded.is_cancelled,
      m_signups=excluded.m_signups, m_active=excluded.m_active, m_cancelled=excluded.m_cancelled,
      m_checked_in=excluded.m_checked_in, m_no_show=excluded.m_no_show,
      is_mine=excluded.is_mine, scraped_at=excluded.scraped_at""",
               (s["id"], s["name"], s["startsAt"], local.date().isoformat(), local.strftime("%H:%M"),
                local.weekday(), s.get("duration"), s.get("locationId"), s.get("location"),
                s.get("teacherId"), s.get("capacity"), int(bool(s.get("isCancelled"))),
                counts.get("numberOfSignUps"), counts.get("active"), counts.get("cancelled"),
                counts.get("checkedIn"), counts.get("noShow"), is_mine, ts))


def save_booking(db, class_id, b, status, ts, cancelled_at=None):
    mid = b["memberId"]
    db.execute("""INSERT INTO customers VALUES (?,?,?,?,?) ON CONFLICT(member_id) DO UPDATE SET
      name=excluded.name, first_name=excluded.first_name, last_name=excluded.last_name,
      updated_at=excluded.updated_at""", (mid, b["name"], b.get("firstName"), b.get("lastName"), ts))
    signed = None
    if b.get("date"):
        signed = datetime.strptime(b["date"], "%a, %d %b %Y %H:%M:%S GMT").replace(tzinfo=timezone.utc).isoformat()
    db.execute("""INSERT INTO signups VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(booking_id) DO UPDATE SET
      status=excluded.status, late_cancel=excluded.late_cancel, signed_up_at=excluded.signed_up_at,
      cancelled_at=COALESCE(excluded.cancelled_at, signups.cancelled_at), spot=excluded.spot,
      payment_mode=excluded.payment_mode, prev_visits=excluded.prev_visits, scraped_at=excluded.scraped_at""",
               (b["id"], class_id, mid, status, int(bool(b.get("isLateCancelled"))), signed,
                cancelled_at, b.get("roomSpotId"), b.get("paymentMode"), b.get("prevVisits"), ts))


def scrape_class(db, src, s, ts):
    sid = s["id"]
    base = f"/primary/host/{HOST_ID}/sessions/{sid}"
    counts = src.get(f"{base}/get-signups-count")
    ended = datetime.fromisoformat(s["endsAt"].replace("Z", "+00:00")) < datetime.now(timezone.utc)
    active = all_bookings(src, f"{base}/session-bookings")
    cancelled = all_bookings(src, f"{base}/session-bookings", {"onlyCancelled": "true"})
    with db:                                    # one transaction per class
        save_class(db, s, counts, ts)
        for b in active:
            save_booking(db, sid, b, status_of(b, ended), ts)
        for b in cancelled:
            # If checked in before the booking was deleted, Momence still counts them as attended
            status = "checked_in" if b.get("checkedIn") else "cancelled"
            save_booking(db, sid, b, status, ts, cancelled_at=b.get("deletedAt"))
    return len(active) + len(cancelled)


def notify(msg):
    subprocess.run(["osascript", "-e", f'display notification "{msg}" with title "ride analytics"'],
                   check=False, capture_output=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=DEFAULT_LOOKBACK_DAYS, help="re-scrape classes of the last N days")
    ap.add_argument("--since", help="YYYY-MM-DD, e.g. 2026-06-01 for the first backfill")
    ap.add_argument("--force", action="store_true", help="ignore the 'ran recently' guard")
    ap.add_argument("--har", nargs="+", help="replay HAR files instead of calling the site (tests)")
    ap.add_argument("--delay", type=float, default=0.5, help="seconds between classes")
    a = ap.parse_args()

    db = connect()
    if not (a.force or a.since or a.har):
        last = db.execute("SELECT MAX(finished_at) FROM runs WHERE ok=1").fetchone()[0]
        if last and datetime.now(timezone.utc) - datetime.fromisoformat(last) < timedelta(days=SKIP_IF_RAN_WITHIN_DAYS):
            print("Ran recently, nothing to do (use --force)."); return

    until = datetime.now(timezone.utc)
    since = (datetime.fromisoformat(a.since).replace(tzinfo=ZoneInfo(TZ)).astimezone(timezone.utc)
             if a.since else until - timedelta(days=a.days))
    run_id = db.execute("INSERT INTO runs(started_at, since) VALUES (?,?)", (now_iso(), since.isoformat())).lastrowid
    db.commit()

    src = HarSource(*a.har) if a.har else LiveSource()
    n_classes = n_signups = 0
    try:
        for s in list_sessions(src, since, until):
            if datetime.fromisoformat(s["endsAt"].replace("Z", "+00:00")) > until:
                continue                        # not finished yet; next run picks it up
            try:
                n_signups += scrape_class(db, src, s, now_iso()); n_classes += 1
                print(f"{s['startsAt'][:10]} {s['name']:<28} {s.get('location')}")
            except KeyError as e:               # only happens with HAR fixtures
                print("  (no fixture for", e, ")")
            if not a.har:
                import time; time.sleep(a.delay)
        db.execute("UPDATE runs SET finished_at=?, classes=?, signups=?, ok=1 WHERE id=?",
                   (now_iso(), n_classes, n_signups, run_id))
        db.commit()
        print(f"Done: {n_classes} classes, {n_signups} bookings.")
    except AuthError as e:
        db.execute("UPDATE runs SET finished_at=?, ok=0, note=? WHERE id=?", (now_iso(), str(e), run_id)); db.commit()
        notify("Momence login expired - run login.py"); sys.exit(str(e))
    finally:
        src.close()


if __name__ == "__main__":
    main()
