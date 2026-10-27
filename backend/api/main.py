"""ride analytics REST API — read-only, SQLite-backed, local use only."""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .db import get_db
from .models import (
    ClassBookings,
    CustomerDetail,
    CustomerSummary,
    LocationSummary,
    TierBreakdown,
)

app = FastAPI(
    title="ride analytics API",
    description="Local REST API for ride class attendance data.",
    version="0.1.0",
)

# Allow the Next.js dev server to call this API if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/customers", response_model=list[CustomerSummary], summary="All customers with lifetime stats")
def list_customers(limit: int = 200, min_attended: int = 0):
    rows = (
        get_db()
        .execute(
            """SELECT member_id, name, attended, no_shows, cancelled, late_cancels,
                  signups, first_visit, last_visit
           FROM v_customer_stats
           WHERE attended >= ?
           ORDER BY attended DESC
           LIMIT ?""",
            (min_attended, limit),
        )
        .fetchall()
    )
    return [dict(r) for r in rows]


@app.get("/customers/{member_id}", response_model=CustomerDetail, summary="Customer detail with visit history")
def get_customer(member_id: int):
    db = get_db()
    stat = db.execute(
        """SELECT member_id, name, attended, no_shows, cancelled, late_cancels,
                  signups, first_visit, last_visit
           FROM v_customer_stats WHERE member_id = ?""",
        (member_id,),
    ).fetchone()
    if not stat:
        raise HTTPException(status_code=404, detail="Customer not found")

    visits = db.execute(
        """SELECT booking_id, class_id, local_date, class_name, location, weekday, is_mine
           FROM v_visits WHERE member_id = ?
           ORDER BY local_date DESC""",
        (member_id,),
    ).fetchall()

    return {**dict(stat), "visits": [dict(v) for v in visits]}


@app.get("/classes/upcoming", response_model=list[ClassBookings], summary="Upcoming classes with current bookings")
def upcoming_classes(days: int = 14):
    # Class dates are stored in Berlin local time, so "today" must be Berlin's too.
    today = datetime.now(ZoneInfo("Europe/Berlin")).date()
    until = today + timedelta(days=days)
    rows = (
        get_db()
        .execute(
            """SELECT c.id AS class_id, c.name AS class_name, c.local_date, c.local_time,
                  c.location, c.weekday, c.capacity,
                  cu.member_id, cu.name AS customer_name,
                  COALESCE(cs.attended, 0) AS attended,
                  cs.last_visit
           FROM classes c
           JOIN signups s ON s.class_id = c.id
           JOIN customers cu ON cu.member_id = s.member_id
           LEFT JOIN v_customer_stats cs ON cs.member_id = cu.member_id
           WHERE c.local_date >= ? AND c.local_date <= ?
             AND c.is_mine = 1 AND c.is_cancelled = 0 AND s.status = 'booked'
           ORDER BY c.local_date, c.local_time, c.location, cu.name""",
            (today.isoformat(), until.isoformat()),
        )
        .fetchall()
    )

    # Group bookings by class
    classes: dict[int, dict] = {}
    for r in rows:
        cid = r["class_id"]
        if cid not in classes:
            classes[cid] = {
                "class_id": cid,
                "class_name": r["class_name"],
                "local_date": r["local_date"],
                "local_time": r["local_time"],
                "location": r["location"],
                "weekday": r["weekday"],
                "capacity": r["capacity"],
                "bookings": [],
            }
        classes[cid]["bookings"].append(
            {
                "member_id": r["member_id"],
                "customer_name": r["customer_name"],
                "attended": r["attended"],
                "last_visit": r["last_visit"],
                "is_first": r["attended"] == 0,
            }
        )
    return list(classes.values())


@app.get("/stats/tiers", response_model=list[TierBreakdown], summary="Customer count per loyalty tier")
def tier_breakdown():
    rows = (
        get_db()
        .execute(
            """SELECT
             CASE
               WHEN attended >= 21 THEN '20x+'
               WHEN attended >= 11 THEN '11-20x'
               WHEN attended >= 6  THEN '6-10x'
               WHEN attended >= 3  THEN '3-5x'
               WHEN attended >= 2  THEN '2x'
               ELSE '1x'
             END AS tier,
             COUNT(*) AS count,
             MIN(attended) AS min_attended
           FROM v_customer_stats
           WHERE attended > 0
           GROUP BY tier
           ORDER BY min_attended DESC"""
        )
        .fetchall()
    )
    return [dict(r) for r in rows]


@app.get("/stats/locations", response_model=list[LocationSummary], summary="Attendance summary per studio")
def location_summary():
    rows = (
        get_db()
        .execute(
            """SELECT COALESCE(location, 'Unknown') AS location,
                  SUM(checked_in) AS total_headcount,
                  COUNT(*) AS classes,
                  ROUND(1.0 * SUM(checked_in) / NULLIF(COUNT(*), 0), 1) AS avg_per_class
           FROM v_class_summary
           WHERE is_mine = 1 AND is_cancelled = 0
           GROUP BY location
           ORDER BY total_headcount DESC"""
        )
        .fetchall()
    )
    return [dict(r) for r in rows]
