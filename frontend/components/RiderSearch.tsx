"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RiderOption } from "@/lib/queries";

const MAX_RESULTS = 8;
const PANEL_PX = 256;
const PANEL_WIDTH = `${PANEL_PX}px`;

function MagnifierIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ display: "block" }}>
      <circle cx="6.5" cy="6.5" r="4.75" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="10" y1="10" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="square" />
    </svg>
  );
}

/** Magnifier button that opens a name search; picking a rider opens their profile. */
export default function RiderSearch({ riders }: { riders: RiderOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [alignRight, setAlignRight] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const matches = q ? riders.filter((r) => r.name.toLowerCase().includes(q)).slice(0, MAX_RESULTS) : [];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };
  const go = (r: RiderOption) => {
    close();
    router.push(`/customers/${r.member_id}`);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "flex" }}>
      <button
        type="button"
        className="field"
        aria-label="Search for a rider"
        aria-expanded={open}
        title="Search for a rider"
        onClick={() => {
          if (open) return close();
          // Open towards whichever side has room, so the panel never runs off screen.
          const left = wrapRef.current?.getBoundingClientRect().left ?? 0;
          setAlignRight(left + PANEL_PX > window.innerWidth - 16);
          setOpen(true);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.25rem",
          height: "2.25rem",
          padding: 0,
          cursor: "pointer",
          backgroundColor: open ? "var(--color-ink)" : "var(--color-apricot)",
          color: open ? "var(--color-chartreuse)" : "var(--color-ink)",
        }}
      >
        <MagnifierIcon />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.375rem)",
            ...(alignRight ? { right: 0 } : { left: 0 }),
            zIndex: 20,
            width: PANEL_WIDTH,
            backgroundColor: "var(--color-apricot)",
            border: "2px solid var(--color-ink)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-md)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
          }}
        >
          <input
            type="search"
            autoFocus
            placeholder="Search for a rider"
            aria-label="Rider name"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, matches.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && matches[active]) go(matches[active]);
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem 0.625rem",
              border: "none",
              borderBottom: q ? "2px solid var(--color-ink)" : "none",
              outline: "none",
              backgroundColor: "var(--color-apricot)",
              color: "var(--color-ink)",
              caretColor: "var(--color-ink)",
              font: "inherit",
            }}
          />
          {q && (
            <ul role="listbox" style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {matches.length === 0 ? (
                <li style={{ padding: "0.5rem 0.625rem", opacity: 0.55 }}>No rider matches</li>
              ) : (
                matches.map((r, i) => (
                  <li
                    key={r.member_id}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(r);
                    }}
                    style={{
                      padding: "0.5rem 0.625rem",
                      cursor: "pointer",
                      backgroundColor: i === active ? "var(--color-ink)" : undefined,
                      color: i === active ? "var(--color-chartreuse)" : undefined,
                    }}
                  >
                    {r.name}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
