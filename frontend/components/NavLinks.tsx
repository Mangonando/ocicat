"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/tiers", label: "Cadence" },
  { href: "/regulars", label: "Regulars" },
  { href: "/lapsed", label: "Lapsed" },
  { href: "/reliability", label: "Reliability" },
  { href: "/locations", label: "Locations" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-1 flex-wrap">
        {NAV.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-mono)",
                  color: active ? "var(--color-chartreuse)" : "var(--color-apricot)",
                  textDecoration: "none",
                  borderBottom: active ? "2px solid var(--color-chartreuse)" : "2px solid transparent",
                  transition: "color 100ms ease",
                }}
                onMouseOver={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.color = "var(--color-vista-blue)";
                }}
                onMouseOut={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.color = "var(--color-apricot)";
                }}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
