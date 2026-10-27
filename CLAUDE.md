# ride-analytics (instructions for Claude Code)

Read ROADMAP.md first and work on the current milestone only.

- Scraper: Python in `backend/scraper/`, SQLite in `data/ride.db`. Dashboard: Next.js + TS + Tailwind + Recharts in `frontend/` (reads SQLite directly). No Docker before M7.
- Keep it simple. Do not add libraries unless asked. Use parameterized SQL.
- Privacy: customer names live only in `data/` (git-ignored). Never put real names in fixtures, tests, logs, commits or the demo build. Never read or print cookies or `.har` files.
- Before saying a step is done, run the milestone's quality gate and show the output.
- Commit per milestone: `M<n>: <title>`. Do not push without being asked.

## Directory layout

```
riders-attendance/          ← ROOT (backend/scraper/config.py: parent.parent.parent)
├── data/                   ← git-ignored; real DB + browser profile live here
│   ├── ride.db
│   └── browser-profile/    ← Playwright persistent context (login cookies)
├── backend/
│   ├── scraper/
│   │   ├── config.py       ← ROOT, DB_PATH, HOST_ID, TZ, BASE URL constants
│   │   ├── login.py        ← run once by hand to store the session
│   │   ├── scrape.py       ← main entry point
│   │   ├── sources.py      ← LiveSource (Playwright) / HarSource (HAR replay)
│   │   ├── schema.sql      ← DDL: classes, customers, signups, runs, views
│   │   ├── migrations/     ← numbered SQL migrations (PRAGMA user_version)
│   │   └── tests/
│   ├── api/                ← optional read-only FastAPI layer (`make api`)
│   ├── launchd/            ← macOS scheduling plist
│   └── requirements*.txt
├── frontend/               ← Next.js dashboard (see frontend/README.md)
├── CHANGES.md              ← git-ignored; UI change list, ticked off as done
├── CLAUDE.md
├── Makefile
└── ROADMAP.md              ← git-ignored
```

## Key constants (backend/scraper/config.py)

| Name | Value |
|------|-------|
| `HOST_ID` | 232291 (ride.bln) |
| `TZ` | Europe/Berlin |
| `BASE` | https://momence.com/_api |
| `DEFAULT_LOOKBACK_DAYS` | 10 |
| `SKIP_IF_RAN_WITHIN_DAYS` | 6 (in scrape.py) |

## Schema tables

- `classes` — one row per Momence session; `m_*` columns mirror Momence aggregate counts for sanity-checking
- `customers` — upserted on every scrape; real names, never leave `data/`
- `signups` — one row per booking; status ∈ `checked_in | no_show | cancelled | booked`
- `runs` — audit log of each scrape run
- `v_customer_stats` — view: attended / no_shows / late_cancels per customer

## Testing without hitting the site

Pass `--har path/to/file.har` to `scrape.py` to replay recorded responses via `HarSource`. Fixtures in `backend/scraper/tests/fixtures/` must use synthetic names only.
