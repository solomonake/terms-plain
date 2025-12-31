import { describe, expect, it } from "vitest";
import { detectFlags } from "./detectFlags";

const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length;

describe("detectFlags", () => {
  it("detects multiple flags from keywords", () => {
    const prefix = "Preface sentence. ".repeat(12);
    const suffix = "Additional terms follow. ".repeat(16);
    const text =
      `${prefix}This lease will automatically renew unless written notice 60 days before the end. ` +
      `An early termination fee applies if you terminate early. ${suffix}`;

    const result = detectFlags(text);
    const ids = result.map((flag) => flag.id);

    expect(ids).toContain("automatic-renewal");
    expect(ids).toContain("notice-period-requirement");
    expect(ids).toContain("early-termination-penalty");
    expect(uniqueIds(ids)).toBe(true);
    const autoRenewal = result.find((flag) => flag.id === "automatic-renewal");
    const autoSnippet = autoRenewal?.evidenceSnippet ?? "";
    const autoMatchStart = text
      .toLowerCase()
      .indexOf("automatically renew");
    const autoMatchEnd = autoMatchStart + "automatically renew".length;
    expect(autoSnippet).toContain("automatically renew");
    expect(autoSnippet.includes("....")).toBe(false);
    if (autoSnippet.startsWith("...")) {
      expect(autoMatchStart).toBeGreaterThan(0);
    }
    if (autoSnippet.endsWith("...")) {
      expect(autoMatchEnd).toBeLessThan(text.length);
    }
    for (const flag of result) {
      expect(flag.evidenceSnippet.length).toBeGreaterThan(0);
      expect(flag.evidenceSnippet.length).toBeLessThanOrEqual(305);
      expect(flag.evidenceSnippet.includes("....")).toBe(false);
    }
  });

  it("detects late fee and deposit deductions", () => {
    const prefix = "Lease overview. ".repeat(12);
    const suffix = "Miscellaneous section. ".repeat(14);
    const text =
      `${prefix}A late fee is 5% after the due date. ` +
      `The security deposit may be deducted for damages. ${suffix}`;

    const result = detectFlags(text);
    const ids = result.map((flag) => flag.id);

    expect(ids).toContain("late-fee-charges");
    expect(ids).toContain("security-deposit-deductions");
    expect(uniqueIds(ids)).toBe(true);
    const lateFee = result.find((flag) => flag.id === "late-fee-charges");
    const lateSnippet = lateFee?.evidenceSnippet ?? "";
    const lateMatchStart = text.toLowerCase().indexOf("late fee");
    const lateMatchEnd = lateMatchStart + "late fee".length;
    expect(lateSnippet).toContain("late fee");
    expect(lateSnippet.includes("....")).toBe(false);
    if (lateSnippet.startsWith("...")) {
      expect(lateMatchStart).toBeGreaterThan(0);
    }
    if (lateSnippet.endsWith("...")) {
      expect(lateMatchEnd).toBeLessThan(text.length);
    }
    for (const flag of result) {
      expect(flag.evidenceSnippet.length).toBeGreaterThan(0);
      expect(flag.evidenceSnippet.length).toBeLessThanOrEqual(305);
      expect(flag.evidenceSnippet.includes("....")).toBe(false);
    }

    const startText =
      "Late fee is 5% after the due date. This is a standard clause.";
    const startResult = detectFlags(startText);
    const startFlag = startResult.find((flag) => flag.id === "late-fee-charges");
    const startSnippet = startFlag?.evidenceSnippet ?? "";
    expect(startSnippet.startsWith("...")).toBe(false);
    if (startSnippet.endsWith("...")) {
      expect(
        "Late fee is 5% after the due date.".length
      ).toBeLessThan(startText.length);
    }
  });

  it("returns empty array when no matches", () => {
    const text =
      "The tenant agrees to keep common areas tidy and follow community guidelines.";

    const result = detectFlags(text);
    expect(result).toEqual([]);
  });
});
