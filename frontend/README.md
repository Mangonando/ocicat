# riders dashboard (frontend)

Local Next.js dashboard for the ride class attendance data. It reads `../data/ride.db`
(read-only, via `better-sqlite3`) in server components; there is no API call in between.
Override the path with `DB_PATH=/path/to/ride.db`.

```bash
npm install
npm run dev        # http://localhost:3000  (Node 20, see .nvmrc)
npm test           # Vitest
npx tsc --noEmit && npm run lint
```

## Layout

| Path | What |
|------|------|
| `app/` | One folder per page: Overview (`page.tsx`), Upcoming, Cadence (`tiers/`), Regulars, Lapsed, Reliability, Locations, rider detail (`customers/[id]`) |
| `components/` | Client dashboards (`OverviewDashboard`, `LocationsDashboard`), charts, tables, filters, and shared layout pieces in `ui.tsx` |
| `lib/queries.ts` | All SQL (parameterized). Everything else in `lib/` is pure and unit-tested |
| `lib/outcomes.ts` | Booking outcomes (attended, no-show, cancelled, late cancel): colours, shares, donut slices |
| `app/globals.css` | Design tokens (palette, fonts, shadows) and the few shared classes |

## Conventions

- Colours come from CSS variables in `globals.css`; components never use raw hex values.
- Pages that depend on "today" call `connection()` and set `export const instant = false`.
- Real customer names only ever come from the local database; tests use synthetic data.

If styles look out of date after editing `globals.css`, stop the dev server, delete `.next/`
and start it again (Turbopack can keep a stale copy of the stylesheet).
