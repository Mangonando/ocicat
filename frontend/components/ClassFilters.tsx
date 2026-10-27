"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ALL_TIME } from "@/lib/format";
import { applyClassFilters, type ClassFilterState, type Filterable } from "@/lib/filters";
import DateRangeFilter from "@/components/DateRangeFilter";

/** Filter state plus the filtered rows, shared by Overview and Locations. */
export function useClassFilters<T extends Filterable>(rows: T[]) {
  const [filters, setFilters] = useState<ClassFilterState>({
    className: "",
    location: "",
    range: ALL_TIME,
  });
  const filtered = useMemo(() => applyClassFilters(rows, filters), [rows, filters]);
  return { filters, setFilters, filtered };
}

/** Class name, location and date range filters in one bar. */
export default function ClassFilters({
  filters,
  onChange,
  locations,
  today,
  shown,
  total,
  children,
}: {
  filters: ClassFilterState;
  onChange: (f: ClassFilterState) => void;
  locations: string[];
  today: string;
  shown: number;
  total: number;
  children?: ReactNode; // extra controls at the end of the bar
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <input
        type="search"
        placeholder="Filter by class name"
        aria-label="Filter by class name"
        value={filters.className}
        onChange={(e) => onChange({ ...filters, className: e.target.value })}
        className="field"
        style={{ width: "14rem" }}
      />
      <select
        value={filters.location}
        onChange={(e) => onChange({ ...filters, location: e.target.value })}
        aria-label="Filter by location"
        className="field"
      >
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <DateRangeFilter
        value={filters.range}
        onChange={(range) => onChange({ ...filters, range })}
        today={today}
      />
      {children}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--color-ink)",
          opacity: 0.55,
        }}
      >
        {shown} of {total} classes
      </span>
    </div>
  );
}
