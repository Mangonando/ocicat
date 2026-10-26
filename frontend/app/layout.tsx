import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ride analytics",
  description: "Local dashboard for ride class attendance",
};

const NAV = [
  { href: "/upcoming", label: "Upcoming" },
  { href: "/tiers", label: "Loyalty tiers" },
  { href: "/regulars", label: "Top regulars" },
  { href: "/lapsed", label: "One-and-done / lapsed" },
  { href: "/reliability", label: "Reliability" },
  { href: "/locations", label: "Locations & trends" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="bg-zinc-900 text-zinc-100 px-6 py-3 flex items-center gap-8">
          <Link href="/" className="font-semibold tracking-tight text-white">
            ride analytics
          </Link>
          <nav className="flex gap-5 text-sm text-zinc-300">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </body>
    </html>
  );
}
