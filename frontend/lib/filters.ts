import { inRange, type DateRange } from "./format";

// The filter bar shared by Overview and Locations.
export interface ClassFilterState {
  className: string;
  location: string; // "" = all
  range: DateRange;
}

export interface Filterable {
  name: string;
  location: string | null;
  local_date: string;
}

export function applyClassFilters<T extends Filterable>(rows: T[], f: ClassFilterState): T[] {
  const q = f.className.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!q || r.name.toLowerCase().includes(q)) &&
      (!f.location || (r.location ?? "Unknown") === f.location) &&
      inRange(r.local_date, f.range),
  );
}
