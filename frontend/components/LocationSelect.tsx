"use client";

import { usePathname, useRouter } from "next/navigation";

/** Location dropdown that stores the choice in the URL (?location=…) so the server can filter. */
export default function LocationSelect({
  locations,
  value,
}: {
  locations: string[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      value={value}
      aria-label="Filter by location"
      className="field"
      onChange={(e) => {
        const loc = e.target.value;
        router.push(loc ? `${pathname}?location=${encodeURIComponent(loc)}` : pathname);
      }}
    >
      <option value="">All locations</option>
      {locations.map((l) => (
        <option key={l} value={l}>
          {l}
        </option>
      ))}
    </select>
  );
}
