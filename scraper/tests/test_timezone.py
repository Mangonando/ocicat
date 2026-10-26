"""Verify Europe/Berlin DST handling: CEST (UTC+2) in summer, CET (UTC+1) in winter."""

from scrape import save_class


def _session(sid, starts_at, ends_at):
    return {
        "id": sid,
        "name": "Test Ride",
        "startsAt": starts_at,
        "endsAt": ends_at,
        "duration": 60,
        "locationId": 1,
        "location": "Test Studio",
        "teacherId": 372616,
        "capacity": 20,
        "isCancelled": False,
    }


COUNTS = {"numberOfSignUps": 0, "active": 0, "cancelled": 0, "checkedIn": 0, "noShow": 0}
TS = "2026-01-01T00:00:00+00:00"


def test_summer_cest(db):
    # 2026-07-14 17:00 UTC → 19:00 CEST (UTC+2), Tuesday
    save_class(db, _session(1, "2026-07-14T17:00:00Z", "2026-07-14T18:00:00Z"), COUNTS, TS)
    row = db.execute("SELECT local_date, local_time, weekday FROM classes WHERE id=1").fetchone()
    assert row == ("2026-07-14", "19:00", 1)  # Tuesday


def test_winter_cet(db):
    # 2026-10-26 17:00 UTC → 18:00 CET (UTC+1), Monday (DST ended Oct 25)
    save_class(db, _session(2, "2026-10-26T17:00:00Z", "2026-10-26T18:00:00Z"), COUNTS, TS)
    row = db.execute("SELECT local_date, local_time, weekday FROM classes WHERE id=2").fetchone()
    assert row == ("2026-10-26", "18:00", 0)  # Monday


def test_dst_boundary(db):
    # 2026-10-25 00:30 UTC is still CEST (UTC+2) → 02:30 local; clocks fall back at 03:00 local (01:00 UTC)
    save_class(db, _session(3, "2026-10-25T00:30:00Z", "2026-10-25T01:30:00Z"), COUNTS, TS)
    row = db.execute("SELECT local_time FROM classes WHERE id=3").fetchone()
    assert row[0] == "02:30"
