# ride-analytics — Roadmap

Goal: know who comes to my classes, how often, who stopped coming, who is reliable, so I can
learn names and strengthen the community. Portfolio piece second.

Rules for both of us (Juan + Claude in VS Code):
- Work one milestone at a time. Do not start the next until the **Quality gate** of the current one passes.
- Keep it simple: no library without a concrete pain. No backend server, no Docker until M7.
- Real names never leave `data/`. Anything public reads `demo/` only.
- Tick boxes as we go. Each milestone ends with a commit: `M<n>: <title>`.
- Claude: before coding, restate the step in one line; after coding, run the gate commands and report results, not claims.

Stack: Python (scraper) · SQLite · Next.js + TypeScript + Tailwind + Recharts · ruff, pytest, ESLint, Prettier, gitleaks.

---

## M0 — Discovery (DONE)
- [x] Find the JSON API (sessions list, session-bookings, get-signups-count)
- [x] Find cancelled (`onlyCancelled=true`) and no-show (`onlyNoShow=true`) requests
- [x] Schema + scraper prototype tested on HAR fixtures
- [x] Decide: native scraper, launchd, SQLite, no backend

## M1 — Live scraper works
- [ ] Delete exported `.har` files and log out/in of Momence (they contained a live session cookie)
- [ ] `python -m venv .venv`, install requirements, `playwright install chromium`
- [ ] Create `.env` from `.env.example` (email + password, `chmod 600`); confirm `LOGIN_URL` in `scraper/config.py` is the "Welcome back!" page
- [ ] `python scrape.py --since 2026-10-19` (small trial first)
- [ ] If 401/403/empty: check whether `x-app` header is required, fix in `sources.py`
- [ ] Full backfill `python scrape.py --since 2026-06-01`
- [ ] Spot-check 3 classes against the Momence UI (signups, checked in, no-shows, cancelled)

**Quality gate**
- For every class: our rows per status == Momence counts (`classes.m_checked_in`, `m_no_show`, `m_cancelled`). Query returns 0 mismatches.
- Re-running the same command creates 0 new rows (idempotent).
- Substitute classes (other instructor's) appear with the right name and are flagged (see M2).
- `git status` shows no `data/`, `.har`, cookies.

## M2 — Data model hardening
- [ ] Add `teacher_id` check / `is_mine` flag so classes I only subbed are filterable
- [ ] Use `PRAGMA user_version` + numbered migration files in `scraper/migrations/`
- [ ] Decide how to treat "friends" bookings (each booking = one row; document it)
- [ ] Add `v_visits` (one row per attended booking) and `v_class_summary` views
- [ ] Mismatch check as a script: `python check_data.py` prints classes where our counts != Momence

**Quality gate**: `check_data.py` exits 0 on the full DB; views return sensible numbers on 5 hand-checked customers.

## M3 — Tooling and tests (Python)
- [ ] `ruff` (lint+format), config in `pyproject.toml`
- [ ] `pytest` with sanitized fixtures (names replaced) in `scraper/tests/fixtures/`
- [ ] Tests: status mapping, timezone/DST (CET vs CEST), pagination, idempotent upsert, auth error path
- [ ] `pre-commit` with ruff + **gitleaks**
- [ ] `Makefile`: `make lint test scrape`

**Quality gate**: `make lint test` green; gitleaks finds nothing; fixtures contain no real names (grep check).

## M4 — Scheduling
- [ ] Fill `/ABSOLUTE/PATH/` in the launchd plist, load it
- [ ] Test: `launchctl kickstart` runs and writes `data/scrape.log`
- [ ] Test: wrong password in `.env` → macOS notification appears; correct one → auto-login works
- [ ] Test: close lid on Tuesday 09:00, open later → job ran on wake
- [ ] Weekly DB backup (`sqlite3 .backup`) to an encrypted location

**Quality gate**: two consecutive Tuesdays run without manual action; `runs` table shows `ok=1`.

## M5 — Dashboard (local, real names)
Tailwind + Recharts only. Server components read SQLite via `better-sqlite3`. Bind to 127.0.0.1.
- [ ] Scaffold `web/` (Next.js, TS, Tailwind), `lib/db.ts` read-only connection
- [ ] Page 1 **Loyalty tiers**: customers by attended 1× / 2× / 3–5× / 6–10× / 11–20× / 20×+
- [ ] Page 2 **Top regulars**: ranking by attended, last visit, favorite location/day
- [ ] Page 3 **One-and-done / lapsed**: came 1–2×, never returned; 5+ visits but absent 3–4 weeks
- [ ] Page 4 **Reliability**: signups, attended, cancelled, late cancels, no-show rate per person
- [ ] Page 5 **Locations & trends**: regulars per studio, people attending both, attendance over time
- [ ] Customer detail page: visit history, so I can learn names

**Quality gate**: each page's numbers equal a hand-written SQL query; empty DB shows an empty state, not a crash; `tsc`, ESLint, Prettier clean; Vitest covers the tier/lapsed logic.

## M6 — Demo / portfolio version
- [ ] `demo/generate.py`: synthetic customers and classes (Faker), same schema
- [ ] `web` runs in two modes via env flag: `local` (real DB) / `demo` (synthetic data)
- [ ] CI test: build output must not contain any real customer name from `data/ride.db` (run locally; CI uses synthetic)
- [ ] Deploy `demo` mode to Vercel
- [ ] README with architecture diagram, decisions, screenshots

**Quality gate**: open the deployed site, search the HTML for 5 real names — none found. Lighthouse sanity check.

## M7 — Optional polish
- [ ] GitHub Actions: lint + tests + audit (`pip-audit`, `npm audit`) + Dependabot
- [ ] `Dockerfile` for `web/` only (non-root, DB mounted read-only, `127.0.0.1` port)
- [ ] Playwright smoke test for the dashboard
- [ ] Optional: FastAPI layer if I want a REST API in the portfolio

---

## Standing quality checklist (every milestone)
1. Does it run from a clean checkout following the README?
2. Are results verified against Momence or a hand query, not just "no errors"?
3. No secrets, cookies, HAR files, names, or DB in git (`git ls-files | grep -E 'har|\.db'` is empty).
4. Lint + tests green.
5. README/ROADMAP updated; one commit per milestone.

## Open questions
- Momence terms of use / ride.bln: tell the manager before sharing anything publicly.
- Do substitute classes count in stats? (default: exclude via `is_mine`)
- Backfill window: from June 2026 or earlier history if Momence has it?
