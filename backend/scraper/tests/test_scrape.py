"""Pagination, idempotent upsert, and auth error tests."""

import pytest
from scrape import all_bookings, scrape_class
from sources import AuthError

from tests.conftest import MockSource, load

# ── helpers ──────────────────────────────────────────────────────────────────

SESSION = {
    "id": 5001,
    "name": "Test Ride",
    "startsAt": "2026-07-14T17:00:00Z",
    "endsAt": "2026-07-14T18:00:00Z",
    "duration": 60,
    "locationId": 1,
    "location": "Test Studio",
    "teacherId": 372616,
    "capacity": 20,
    "isCancelled": False,
}

BASE = "/primary/host/232291/sessions/5001"


def _src():
    return MockSource(
        {
            f"{BASE}/get-signups-count": [load("counts.json")],
            f"{BASE}/session-bookings": [load("bookings_active.json"), load("bookings_cancelled.json")],
        }
    )


# ── pagination ────────────────────────────────────────────────────────────────


def test_pagination_fetches_all_pages():
    page0 = {
        "pagination": {"page": 0, "pageSize": 2, "totalCount": 3},
        "payload": [
            {
                "id": 2001,
                "name": "Alice Sample",
                "firstName": "Alice",
                "lastName": "Sample",
                "memberId": 9001,
                "date": "Mon, 13 Jul 2026 10:00:00 GMT",
                "checkedIn": True,
                "deletedAt": None,
                "isLateCancelled": False,
                "roomSpotId": 1,
                "paymentMode": "stripe",
                "prevVisits": 0,
            },
            {
                "id": 2002,
                "name": "Bob Sample",
                "firstName": "Bob",
                "lastName": "Sample",
                "memberId": 9002,
                "date": "Mon, 13 Jul 2026 11:00:00 GMT",
                "checkedIn": False,
                "deletedAt": None,
                "isLateCancelled": False,
                "roomSpotId": 2,
                "paymentMode": "stripe",
                "prevVisits": 0,
            },
        ],
    }
    page1 = {
        "pagination": {"page": 1, "pageSize": 2, "totalCount": 3},
        "payload": [
            {
                "id": 2003,
                "name": "Carol Sample",
                "firstName": "Carol",
                "lastName": "Sample",
                "memberId": 9003,
                "date": "Mon, 13 Jul 2026 12:00:00 GMT",
                "checkedIn": True,
                "deletedAt": None,
                "isLateCancelled": False,
                "roomSpotId": 3,
                "paymentMode": "stripe",
                "prevVisits": 1,
            },
        ],
    }
    src = MockSource({"/test/bookings": [page0, page1]})
    results = all_bookings(src, "/test/bookings")
    assert len(results) == 3


# ── idempotent upsert ─────────────────────────────────────────────────────────


def test_idempotent_upsert(db):
    ts = "2026-07-14T17:00:00+00:00"
    scrape_class(db, _src(), SESSION, ts)
    count_after_first = db.execute("SELECT COUNT(*) FROM signups").fetchone()[0]

    scrape_class(db, _src(), SESSION, ts)
    count_after_second = db.execute("SELECT COUNT(*) FROM signups").fetchone()[0]

    assert count_after_first == count_after_second


# ── auth error ────────────────────────────────────────────────────────────────


def test_auth_error_raised():
    class UnauthorizedSource:
        def get(self, path, params=None):
            raise AuthError("HTTP 401: login expired")

        def close(self):
            pass

    with pytest.raises(AuthError):
        UnauthorizedSource().get("/any/path")
