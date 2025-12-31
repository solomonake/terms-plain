import { describe, expect, it } from "vitest";
import { parsePossiblyFencedJson } from "./parseJson";

describe("parsePossiblyFencedJson", () => {
  it("parses plain JSON string", () => {
    const result = parsePossiblyFencedJson('{"summaryBullets":["One"]}');
    expect(result).toEqual({ summaryBullets: ["One"] });
  });

  it("parses fenced JSON with ```json", () => {
    const result = parsePossiblyFencedJson(
      "```json\n{\"summaryBullets\":[\"Two\"]}\n```"
    );
    expect(result).toEqual({ summaryBullets: ["Two"] });
  });

  it("parses fenced JSON with ```", () => {
    const result = parsePossiblyFencedJson(
      "```\n{\"summaryBullets\":[\"Three\"]}\n```"
    );
    expect(result).toEqual({ summaryBullets: ["Three"] });
  });

  it("parses when JSON object is embedded in extra text", () => {
    const result = parsePossiblyFencedJson(
      "Here is your result: {\"summaryBullets\":[\"Four\"]} Thanks!"
    );
    expect(result).toEqual({ summaryBullets: ["Four"] });
  });

  it("throws when no JSON object exists", () => {
    expect(() => parsePossiblyFencedJson("Not JSON at all")).toThrow(
      "Invalid JSON from Gemini"
    );
  });
});
