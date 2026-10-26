"""Verify our signup counts match Momence's reported aggregates. Exits 1 if mismatches found."""

import sqlite3
import sys

from config import DB_PATH

db = sqlite3.connect(DB_PATH)
db.row_factory = sqlite3.Row

rows = db.execute("""
    SELECT c.local_date, c.name, c.location,
           c.m_checked_in,                    SUM(s.status='checked_in') AS our_checked_in,
           c.m_no_show,                       SUM(s.status='no_show')    AS our_no_show,
           c.m_cancelled,                     SUM(s.status='cancelled')  AS our_cancelled
    FROM classes c
    JOIN signups s ON s.class_id = c.id
    GROUP BY c.id
    HAVING c.m_checked_in  != our_checked_in
        OR c.m_no_show     != our_no_show
        OR c.m_cancelled   != our_cancelled
    ORDER BY c.local_date
""").fetchall()

# Known exceptions: Momence counts physical seats for group bookings where the friend
# has no Momence account (additionalCustomers with no memberId). These show as +1 checked_in
# in Momence's aggregate but produce no booking row we can store. Acceptable gap <= 2 per class.
KNOWN_GAPS = {
    ("2026-07-14", "Latin Hits special - Colombia Edition 🇬🇧"): {"checked_in": 1},
}

real_mismatches = []
for r in rows:
    key = (r["local_date"], r["name"])
    gap = KNOWN_GAPS.get(key, {})
    ci_diff = r["m_checked_in"] - r["our_checked_in"]
    ns_diff = r["m_no_show"] - r["our_no_show"]
    can_diff = r["m_cancelled"] - r["our_cancelled"]
    if ci_diff == gap.get("checked_in", 0) and ns_diff == 0 and can_diff == 0:
        print(f"KNOWN  {r['local_date']} {r['name']} — group booking gap ({ci_diff} guest without Momence account)")
    else:
        real_mismatches.append(r)

if not real_mismatches:
    print("OK — all classes match Momence counts (known gaps noted above).")
    sys.exit(0)

print(f"\nMISMATCH in {len(real_mismatches)} class(es):\n")
for r in real_mismatches:
    print(f"  {r['local_date']} {r['name']} @ {r['location']}")
    print(f"    checked_in : momence={r['m_checked_in']}  ours={r['our_checked_in']}")
    print(f"    no_show    : momence={r['m_no_show']}  ours={r['our_no_show']}")
    print(f"    cancelled  : momence={r['m_cancelled']}  ours={r['our_cancelled']}")
sys.exit(1)
