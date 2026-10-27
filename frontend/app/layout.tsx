import type { Metadata } from "next";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "riders analytics",
  description: "Local attendance dashboard for indoor cycling riders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            backgroundColor: "var(--color-ink)",
            borderBottom: "3px solid var(--color-ink)",
            padding: "0 2rem",
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            minHeight: "56px",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              letterSpacing: "-0.01em",
              color: "var(--color-chartreuse)",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            riders
          </Link>
          <NavLinks />
        </header>
        <main style={{ minHeight: "calc(100vh - 59px)", padding: "2rem" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
