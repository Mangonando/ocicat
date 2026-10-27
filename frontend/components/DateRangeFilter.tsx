"use client";

import { ALL_TIME, monthRange, type DateRange } from "@/lib/format";
import DatePicker from "@/components/DatePicker";

interface Props {
  value: DateRange;
  onChange: (r: DateRange) => void;
  today: string; // YYYY-MM-DD in Berlin, for the month presets
}

/** From / to date pickers plus "This month", "Last month", "All time" presets. */
export default function DateRangeFilter({ value, onChange, today }: Props) {
  const presets: [string, DateRange][] = [
    ["This month", monthRange(today, 0)],
    ["Last month", monthRange(today, -1)],
    ["All time", ALL_TIME],
  ];
  const same = (a: DateRange, b: DateRange) => a.from === b.from && a.to === b.to;

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <DatePicker
        label="From date"
        placeholder="From"
        value={value.from}
        today={today}
        max={value.to || undefined}
        rangeFrom={value.from}
        rangeTo={value.to}
        onChange={(from) => onChange({ ...value, from })}
      />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.55 }}>to</span>
      <DatePicker
        label="To date"
        placeholder="To"
        value={value.to}
        today={today}
        min={value.from || undefined}
        rangeFrom={value.from}
        rangeTo={value.to}
        onChange={(to) => onChange({ ...value, to })}
      />
      <div role="group" aria-label="Date presets" style={{ display: "flex", gap: "0.375rem" }}>
        {presets.map(([label, range]) => (
          <button
            key={label}
            type="button"
            className="toggle"
            aria-pressed={same(value, range)}
            onClick={() => onChange(range)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
