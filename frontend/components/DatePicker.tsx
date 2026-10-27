"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { shortDate } from "@/lib/format";

interface Props {
  value: string; // YYYY-MM-DD or "" for none
  onChange: (iso: string) => void;
  label: string; // accessible name, e.g. "From date"
  placeholder: string;
  today: string;
  min?: string;
  max?: string;
  rangeFrom?: string; // tints the days between from and to
  rangeTo?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function iso(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
}

/** Six Monday-first weeks covering the month, as ISO dates. */
function monthGrid(year: number, month: number): string[] {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => iso(year, month, 1 - lead + i));
}

/** Date field with a calendar popover drawn in the dashboard style (not the browser's native one). */
export default function DatePicker({
  value, onChange, label, placeholder, today, min, max, rangeFrom, rangeTo,
}: Props) {
  const [open, setOpen] = useState(false);
  const start = value || today;
  const [view, setView] = useState({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      const s = value || today;
      setView({ y: Number(s.slice(0, 4)), m: Number(s.slice(5, 7)) - 1 });
    }
    setOpen((o) => !o);
  }

  function shift(delta: number) {
    setView(({ y, m }) => {
      const d = new Date(Date.UTC(y, m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  }

  function pick(day: string) {
    onChange(day);
    setOpen(false);
  }

  const disabled = (day: string) => (!!min && day < min) || (!!max && day > max);
  const inRange = (day: string) =>
    !!rangeFrom && !!rangeTo && day >= rangeFrom && day <= rangeTo;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="field"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        style={{ minWidth: "9.5rem", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: "0.5rem" }}
      >
        <span style={{ opacity: value ? 1 : 0.5 }}>
          {value ? `${shortDate(value)} ${value.slice(0, 4)}` : placeholder}
        </span>
        <span aria-hidden style={{ opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div role="dialog" aria-label={label} style={S.popover}>
          <div style={S.head}>
            <span style={S.title}>
              {MONTHS[view.m]} {view.y}
            </span>
            <span style={{ display: "flex", gap: "0.25rem" }}>
              <button type="button" className="calendar-nav" style={S.nav} aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
              <button type="button" className="calendar-nav" style={S.nav} aria-label="Next month" onClick={() => shift(1)}>›</button>
            </span>
          </div>

          <div role="grid" style={S.grid}>
            {WEEKDAYS.map((d, i) => (
              <span key={i} style={S.weekday} aria-hidden>
                {d}
              </span>
            ))}
            {monthGrid(view.y, view.m).map((day) => {
              const outside = Number(day.slice(5, 7)) - 1 !== view.m;
              const selected = day === value;
              return (
                <button
                  key={day}
                  type="button"
                  className="calendar-day"
                  style={dayStyle({
                    selected,
                    today: day === today,
                    inRange: inRange(day),
                    outside,
                    disabled: disabled(day),
                  })}
                  disabled={disabled(day)}
                  aria-label={`${shortDate(day)} ${day.slice(0, 4)}`}
                  aria-pressed={selected}
                  onClick={() => pick(day)}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>

          <div style={S.foot}>
            <button type="button" className="calendar-link" style={S.link} onClick={() => pick("")}>
              Clear
            </button>
            <button
              type="button"
              className="calendar-link"
              style={{ ...S.link, ...(disabled(today) ? { opacity: 0.35, cursor: "not-allowed" } : {}) }}
              disabled={disabled(today)}
              onClick={() => pick(today)}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Layout, colours and type live here so the calendar always renders as a real
// calendar; globals.css only adds hover and focus states (.calendar-*).
const S = {
  popover: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    zIndex: 20,
    width: "17rem",
    padding: "0.875rem",
    backgroundColor: "var(--color-apricot)",
    border: "2px solid var(--color-ink)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-md)",
    fontFamily: "var(--font-mono)",
    color: "var(--color-ink)",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.625rem",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-lg)",
    letterSpacing: "-0.01em",
  },
  nav: {
    width: "1.75rem",
    height: "1.75rem",
    border: "2px solid var(--color-ink)",
    borderRadius: "var(--radius)",
    backgroundColor: "var(--color-apricot)",
    color: "var(--color-ink)",
    fontSize: "1rem",
    lineHeight: 1,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px",
  },
  weekday: {
    textAlign: "center",
    fontSize: "var(--text-xs)",
    opacity: 0.55,
    paddingBottom: "0.25rem",
  },
  foot: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "0.625rem",
    paddingTop: "0.5rem",
    borderTop: "1px solid color-mix(in srgb, var(--color-ink) 20%, var(--color-apricot))",
  },
  link: {
    background: "none",
    border: "none",
    padding: 0,
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--color-ink)",
    textDecoration: "underline",
    textDecorationColor: "var(--color-vista-blue)",
    textUnderlineOffset: "3px",
    cursor: "pointer",
  },
} satisfies Record<string, CSSProperties>;

function dayStyle(d: {
  selected: boolean;
  today: boolean;
  inRange: boolean;
  outside: boolean;
  disabled: boolean;
}): CSSProperties {
  return {
    aspectRatio: "1",
    border: `1.5px solid ${d.today ? "var(--color-ink)" : "transparent"}`,
    borderRadius: "var(--radius)",
    backgroundColor: d.selected
      ? "var(--color-ink)"
      : d.inRange
        ? "color-mix(in srgb, var(--color-chartreuse) 45%, var(--color-apricot))"
        : "transparent",
    color: d.selected ? "var(--color-chartreuse)" : "var(--color-ink)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    fontWeight: d.selected ? 500 : 400,
    opacity: d.disabled ? 0.2 : d.outside && !d.selected ? 0.4 : 1,
    cursor: d.disabled ? "not-allowed" : "pointer",
    padding: 0,
  };
}
