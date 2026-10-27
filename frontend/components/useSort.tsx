"use client";

import { useState } from "react";

export type SortDir = "asc" | "desc";

/** Click-to-sort column state. Clicking the active column flips direction; a new column
 * starts descending (numbers, newest first) unless it is listed in `ascByDefault`. */
export function useSort<K extends string>(initialKey: K, ascByDefault: readonly K[] = []) {
  const firstDir = (k: K): SortDir => (ascByDefault.includes(k) ? "asc" : "desc");
  const [key, setKey] = useState<K>(initialKey);
  const [dir, setDir] = useState<SortDir>(firstDir(initialKey));

  function toggle(k: K) {
    if (k === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setKey(k);
      setDir(firstDir(k));
    }
  }

  /** A clickable <th> for column `k`. */
  function th(k: K, label: string) {
    const active = k === key;
    return (
      <th
        key={k}
        onClick={() => toggle(k)}
        style={{ cursor: "pointer", userSelect: "none" }}
        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        {active ? (dir === "asc" ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  return { key, dir, th };
}

/** Comparator for strings, numbers and nulls (nulls sort as the smallest value). */
export function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  return a < b ? -1 : 1;
}
