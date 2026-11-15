import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The Gemini SDK is replaced for this whole file, so no request can reach
// the real API. The fake key below is not a real credential.
const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import routes from "./routes";

const FALLBACK_BULLET_COUNT = 4;

// JSON parsing and route mounting only, with a fresh app per request. The
// full app (CORS, rate limit, error handler) is covered in
// app.inputHardening.test.ts.
const createApp = () => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(routes);
  return app;
};

// Made-up lease text. Not taken from any real lease or person.
const sampleLease = (marker: string) =>
  [
    `Sample lease ${marker} between Example Landlord LLC and Sample Tenant.`,
    "Rent is $1,000 per month, due on the first day of each month.",
    "This lease will automatically renew for an additional 12-month term",
    "unless Tenant provides written notice at least 60 days before the end date.",
    "An early termination fee equal to two months rent applies if Tenant leaves early.",
  ].join(" ");

const geminiJson = (payload: unknown) => ({ text: JSON.stringify(payload) });

describe("POST /analyze over HTTP with the Gemini call stubbed", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "fake-key-for-tests";
    generateContent.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
    vi.restoreAllMocks();
  });

  it("answers the health check", async () => {
    const response = await request(createApp()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("returns the generated summary and rule-based flags", async () => {
    const bullets = [
      "Rent is $1,000 per month, due on the first.",
      "The lease renews for 12 months unless you give 60 days written notice.",
      "Leaving early costs a fee equal to two months rent.",
    ];
    generateContent.mockResolvedValueOnce(
      geminiJson({ summaryBullets: bullets })
    );
    const text = sampleLease("success");

    const response = await request(createApp()).post("/analyze").send({ text });

    expect(response.status).toBe(200);
    expect(response.body.summaryBullets).toEqual(bullets);
    const flagIds = response.body.flags.map((flag: { id: string }) => flag.id);
    expect(flagIds).toContain("automatic-renewal");
    expect(flagIds).toContain("notice-period-requirement");
    expect(flagIds).toContain("early-termination-penalty");

    expect(generateContent).toHaveBeenCalledTimes(1);
    const call = generateContent.mock.calls[0][0];
    expect(call.model).toBe("gemini-2.5-flash");
    expect(call.contents[0].parts[0].text).toContain(text);
  });

  it("serves a repeated request from the cache without a second AI call", async () => {
    generateContent.mockResolvedValue(
      geminiJson({ summaryBullets: ["One.", "Two.", "Three."] })
    );
    const text = sampleLease("cache");
    const app = createApp();

    const first = await request(app).post("/analyze").send({ text });
    const second = await request(app).post("/analyze").send({ text });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("rejects a missing or blank lease text with 400 and no AI call", async () => {
    const app = createApp();

    const missing = await request(app).post("/analyze").send({});
    const blank = await request(app).post("/analyze").send({ text: "   \n " });

    for (const response of [missing, blank]) {
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Lease text is required." });
    }
    expect(generateContent).not.toHaveBeenCalled();
  });

  // Current behavior, not an endorsement: when the AI call fails the route
  // still answers 200 with fixed generic bullets and no failure status.
  // SOL-18 proposes replacing this with an explicit unavailable state.
  it("currently answers 200 with fixed fallback bullets when the AI call fails", async () => {
    generateContent.mockRejectedValueOnce(new Error("stubbed outage"));

    const response = await request(createApp())
      .post("/analyze")
      .send({ text: sampleLease("ai-failure") });

    expect(response.status).toBe(200);
    expect(response.body.summaryBullets).toHaveLength(FALLBACK_BULLET_COUNT);
    expect(response.body.flags.length).toBeGreaterThan(0);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("currently uses the same fallback when the AI returns text that is not JSON", async () => {
    generateContent.mockResolvedValueOnce({ text: "Sorry, I cannot help." });

    const response = await request(createApp())
      .post("/analyze")
      .send({ text: sampleLease("not-json") });

    expect(response.status).toBe(200);
    expect(response.body.summaryBullets).toHaveLength(FALLBACK_BULLET_COUNT);
  });

  it("pads a short fenced AI answer up to three bullets", async () => {
    generateContent.mockResolvedValueOnce({
      text: '```json\n{"summaryBullets": ["Rent is $1,000 per month."]}\n```',
    });

    const response = await request(createApp())
      .post("/analyze")
      .send({ text: sampleLease("short-answer") });

    expect(response.status).toBe(200);
    expect(response.body.summaryBullets).toEqual([
      "Rent is $1,000 per month.",
      "Not specified in the text provided.",
      "Not specified in the text provided.",
    ]);
  });

  it("silently analyzes only the first 20,000 characters of a longer lease", async () => {
    generateContent.mockResolvedValueOnce(
      geminiJson({ summaryBullets: ["One.", "Two.", "Three."] })
    );
    const lateClause = "LATE-CLAUSE-MARKER sublease is prohibited.";
    const text = `${"Filler sentence for a long made-up lease. ".repeat(500)}${lateClause}`;
    expect(text.length).toBeGreaterThan(20000);

    const response = await request(createApp()).post("/analyze").send({ text });

    expect(response.status).toBe(200);
    const prompt = generateContent.mock.calls[0][0].contents[0].parts[0].text;
    expect(prompt).not.toContain("LATE-CLAUSE-MARKER");
    const flagIds = response.body.flags.map((flag: { id: string }) => flag.id);
    expect(flagIds).not.toContain("sublease-restriction");
    expect(response.body).not.toHaveProperty("truncated");
  });

  it("answers 400 when text is not a string, without an AI call", async () => {
    const app = createApp();

    const numeric = await request(app).post("/analyze").send({ text: 123 });
    const list = await request(app).post("/analyze").send({ text: ["a lease"] });

    for (const response of [numeric, list]) {
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Lease text is required." });
    }
    expect(generateContent).not.toHaveBeenCalled();
  });
});
