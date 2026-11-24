"use client";

import { usePathname } from "next/navigation";

export default function SectionHeader() {
  if (usePathname() === "/") return null;
  return (
    <div className="header-text">
      <h1>Termsplain</h1>
      <p className="subline">
        Understand your lease before it costs you and leave early if
        you need to.
      </p>
      <p className="disclaimer">
        This is for information, not legal advice
      </p>
    </div>
  );
}
