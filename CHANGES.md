# ride analytics — change log

Tasks to work through one by one. Add new items at the bottom; tick them off as they're done.

---

## Navbar

- [x] Rename brand wordmark from "ride.bln" to "riders"
- [x] Rename nav item "Tiers" to "Cadence" (softer framing — describes visit rhythm, not a ranking). Alternatives if Cadence doesn't feel right: Frequency, Habits, Rhythm

## Overview

- [x] Make the class-name filter and the location filter apply to the whole page, not just the table: the stat tiles (classes, bookings, riders, check-in rate, no-show rate) and the Attendance donut and its legend should be recalculated from the filtered classes
- [x] Rename the "students" stat tile to "riders"
- [x] Add a "Cancel rate" column to the class table: cancelled ÷ bookings. Rename the current "Rate" column to "Check-in rate" so the two can't be mixed up
- [x] Add a "cancel rate" stat tile next to the no-show rate (it follows the filters as well). Cancellations are about 30% of all bookings, much more than no-shows (2%), so the number is worth tracking. If late cancels can be told apart from early ones (`v_customer_stats` already counts `late_cancels`), show those separately, since a late cancel leaves a bike empty
- [x] Check why the bookings tile (1.918) and the donut total (1,834) differ. Probably the 84 extra rows are still `booked` on upcoming classes. Either leave them out of the tile or add a "booked" slice to the donut, and explain the difference in the subtitle
- [x] Use the same number format everywhere: the tiles show "1.918" and the donut shows "1,834"

## Upcoming

- [x] Show upcoming classes as one list sorted by date and time, soonest first, instead of grouping them by studio
- [x] Show the studio on each class (for example as a small label next to the class name) so it's still clear where each class is

## Tiers (becomes "Cadence", see Navbar)

- [x] In the tier lists, put a small marker next to riders who have at least one future booking: a calendar icon or a colored dot. Not a star, because a star reads as a ranking. It is always visible, so you can see at a glance who is booked without hovering or clicking. Add a short legend so the meaning is clear. Clicking the rider opens their detail view, and the Upcoming section there shows which classes they're booked for. There is no hover tooltip
- [x] Add a location filter to the Regular list, using the same dropdown style as the Overview page. Options: All locations, Studio Prenzlauer Berg, Studio Charlottenburg. With a studio selected, only riders who have attended classes at that studio appear, and their counts include only that studio's classes

## Reliability

- [x] For each rider, show what percentage of their past bookings ended in each outcome: attended, no-show, cancelled and late cancel. Future bookings that haven't happened yet are left out. Count cancelled and late cancel separately, with no overlap, so the four percentages add up to 100%
- [x] Add a "missed" percentage: no-show + cancelled + late cancel. Show it next to attended (attended % vs missed %) so it's easy to see how often a rider books but doesn't come
- [x] Each percentage column can be sorted. A small stacked bar per rider (attended / no-show / cancelled / late cancel, in the same colors as Rider detail) would make the split readable at a glance

## Locations

- [x] Attendance by slot: remove Monday 20:00. It was a one-off sub, not a regular slot, and gives that time too much weight. Show only recurring slots (for example, slots with at least 3 classes) so future one-offs drop out automatically too
- [x] Weekly check-ins and monthly attendance by location: count past classes only. Future classes have no check-ins yet, so they show up as false zeros. Drop November (it hasn't happened yet). Mark the current month as "so far"
- [x] Monthly breakdown: add the number of classes held each month (cancellations, skipped weeks and bank holidays change it). Add "avg check-ins per class" and per-month rates (check-in %, no-show %, cancel %, late cancel %) so months with a different number of classes can be compared fairly
- [x] Weekly line chart, studio filter: Prenzlauer Berg, Charlottenburg, or both. With both selected, draw one line per studio in its studio color so the two can be compared
- [x] Weekly line chart, metric picker: check-ins, no-shows, cancels, late cancels. One metric at a time keeps it readable when both studios are shown
- [x] Label the x-axis with dates instead of week numbers: the start date of the week (for example "6 Oct"), and the full date range in the tooltip
- [x] Optional: more charts in the same style. Ideas: a donut per studio showing how its bookings split by outcome, and a bar chart of avg check-ins per class by month for each studio

## Rider detail (the same view in Tiers: Regular and Lapsed, and in Reliability)

- [x] Add an "Upcoming" section above the visit history. It lists the future classes the rider is booked for (date, time, class, studio), soonest first. If there are none, say so
- [x] Show every booking in the visit history, not just attendances: attended, no-show, cancelled and late cancel, in one list sorted by date. Attended rows look normal. No-show, cancelled and late-cancel rows each get their own color plus a small text label, so the meaning doesn't depend on color alone. Reuse the colors already in the dashboard (no-show red, cancelled blue) and add one for late cancel. Add a small legend, and show counts per status at the top (for example "12 attended · 2 no-shows · 3 cancelled · 1 late cancel"). This shows when a rider wanted to come but didn't make it

## Date range filter (Overview, and Weekly by studio on Locations)

- [x] Add a date range filter (from / to) on the Overview page, next to the class-name and location filters, for example 1 Sep – 30 Sep. All three filters combine
- [x] The tiles, the Attendance donut and the class table all follow the date range
- [x] Quick presets next to the date pickers: "This month", "Last month", "All time". Default is All time
- [x] Show the active range in the Attendance subtitle (for example "1–30 Sep 2026") so it's clear the numbers are filtered
- [x] Locations: add the same date range filter (with the same presets) to the "Weekly by studio" chart. It works together with the studio and metric pickers and only affects that chart. Upcoming classes stay excluded

## Calendar and filters on Locations

- [x] Replace the browser's native date picker with a calendar that matches the dashboard style: apricot surface, ink border, hard shadow, Anton month title, mono day numbers. Selected day in ink, today outlined, days inside the chosen range tinted. Prev/next month buttons, "Clear" and "Today" at the bottom. Closes on outside click or Escape
- [x] Locations & trends: add the same filter bar as the Overview (class name, location, date range with This month / Last month / All time) at the top of the page. It applies to everything on the page: studio cards, booking outcome donuts, attendance by slot, weekly by studio, monthly charts and the monthly breakdown table. Past classes only, as before
- [x] Remove the separate date filter from the Weekly by studio chart (the page filter replaces it). The location filter also replaces the chart's studio toggle; the metric picker stays
- [x] Attendance by slot: decide which slots are recurring (3+ classes) from all past classes, not from the filtered range, so a short range doesn't hide regular slots
