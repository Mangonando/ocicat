"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// Set once the user has moved between pages in this tab, so "back" stays inside the app.
let navigatedInApp = false;
export function markInAppNavigation() {
  navigatedInApp = true;
}

/** Goes back to whichever page opened this one; falls back to Overview on a direct visit. */
export default function BackLink() {
  const router = useRouter();
  return (
    <Link
      href="/"
      onClick={(e) => {
        if (navigatedInApp) {
          e.preventDefault();
          router.back();
        }
      }}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        color: "var(--color-ink)",
        opacity: 0.55,
        textDecoration: "none",
        display: "inline-block",
        marginBottom: "1rem",
      }}
    >
      ← Back
    </Link>
  );
}
