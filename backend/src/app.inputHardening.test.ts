import type { Server } from "node:http";
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

import { createApp } from "./app";

// Made-up text. Not taken from any real lease or person.
const LEASE =
  "Sample lease between Example Landlord LLC and Sample Tenant. Rent is $900 per month, due on the first day of each month.";
const CLAUSE =
  "Sample clause: Tenant must give written notice at least 60 days before the end date.";
const QUESTION = "When is rent due?";

// Values a client could send where text is expected. None may reach the AI
// call, and none may be turned into a string.
const NOT_TEXT: Array<[string, unknown]> = [
  ["a number", 123],
  ["zero", 0],
  ["true", true],
  ["false", false],
  ["an array", ["a lease"]],
  ["an object", { value: "a lease" }],
  ["null", null],
  ["a blank string", "  \n "],
];

const geminiJson = (payload: unknown) => ({ text: JSON.stringify(payload) });

describe("request validation on the real app", () => {
  let server: Server;
  let originalKey: string | undefined;

  // One listening server per test: every request in a test hits the same
  // server, and each test gets a fresh rate limit counter.
  beforeEach(async () => {
    originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "fake-key-for-tests";
    generateContent.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    server = createApp().listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
    vi.restoreAllMocks();
  });

  const expectStillHealthy = async () => {
    const health = await request(server).get("/health");
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ ok: true });
  };

  describe("POST /analyze", () => {
    it.each(NOT_TEXT)("answers 400 when text is %s", async (_name, value) => {
      const response = await request(server).post("/analyze").send({ text: value });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Lease text is required." });
      expect(generateContent).not.toHaveBeenCalled();
      await expectStillHealthy();
    });

    it("answers 400 when the body is empty, absent or an array", async () => {
      const empty = await request(server).post("/analyze").send({});
      const absent = await request(server).post("/analyze");
      const array = await request(server).post("/analyze").send([LEASE]);
      const notJsonType = await request(server)
        .post("/analyze")
        .set("Content-Type", "text/plain")
        .send(LEASE);

      for (const response of [empty, absent, array, notJsonType]) {
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Lease text is required." });
      }
      expect(generateContent).not.toHaveBeenCalled();
      await expectStillHealthy();
    });
  });

  describe("POST /explain", () => {
    it.each(NOT_TEXT)("answers 400 when clause is %s", async (_name, value) => {
      const response = await request(server).post("/explain").send({ clause: value });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Clause text is required." });
      expect(generateContent).not.toHaveBeenCalled();
      await expectStillHealthy();
    });

    it("answers 400 when the body is empty or absent", async () => {
      const empty = await request(server).post("/explain").send({});
      const absent = await request(server).post("/explain");

      for (const response of [empty, absent]) {
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Clause text is required." });
      }
      expect(generateContent).not.toHaveBeenCalled();
    });
  });

  describe("POST /qa", () => {
    it.each(NOT_TEXT)("answers 400 when question is %s", async (_name, value) => {
      const response = await request(server)
        .post("/qa")
        .send({ question: value, text: LEASE });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Question is required." });
      expect(generateContent).not.toHaveBeenCalled();
      await expectStillHealthy();
    });

    it.each(NOT_TEXT)("answers 400 when text is %s", async (_name, value) => {
      const response = await request(server)
        .post("/qa")
        .send({ question: QUESTION, text: value });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Lease text is required." });
      expect(generateContent).not.toHaveBeenCalled();
      await expectStillHealthy();
    });

    it("answers 400 when the body is empty or absent", async () => {
      const empty = await request(server).post("/qa").send({});
      const absent = await request(server).post("/qa");

      for (const response of [empty, absent]) {
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Question is required." });
      }
      expect(generateContent).not.toHaveBeenCalled();
    });
  });

  describe("request bodies the JSON parser rejects", () => {
    const BROKEN_BODIES: Array<[string, string]> = [
      ["cut off JSON", '{"text": "Sample lease'],
      ["a trailing comma", '{"text": "Sample lease",}'],
      ["a bare number", "123"],
      ["a bare string", '"Sample lease"'],
      ["a bare null", "null"],
      ["a bare true", "true"],
    ];

    it.each(BROKEN_BODIES)("answers 400 for %s", async (_name, body) => {
      const response = await request(server)
        .post("/analyze")
        .set("Content-Type", "application/json")
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Request body must be valid JSON." });
      // Nothing internal in the answer: no parser message, stack or echo of
      // what was sent.
      expect(response.text).not.toMatch(/SyntaxError|Unexpected|at JSON|Sample lease/);
      expect(generateContent).not.toHaveBeenCalled();
      await expectStillHealthy();
    });

    it("answers 413, not 400 or 500, for a body over the 2 MB limit", async () => {
      const response = await request(server)
        .post("/analyze")
        .send({ text: "x".repeat(2 * 1024 * 1024 + 1024) });

      expect(response.status).toBe(413);
      expect(response.body).toEqual({ error: "Request body is too large." });
      expect(generateContent).not.toHaveBeenCalled();
      await expectStillHealthy();
    });

    it("does not write the rejected body to the error log", async () => {
      const errorLog = vi.mocked(console.error);

      await request(server)
        .post("/analyze")
        .set("Content-Type", "application/json")
        .send('{"text": "PRIVATE-LEASE-MARKER');

      const logged = JSON.stringify(
        errorLog.mock.calls.map((call) =>
          call.map((part) =>
            part instanceof Error ? { ...part, message: part.message } : part
          )
        )
      );
      expect(logged).not.toContain("PRIVATE-LEASE-MARKER");
    });
  });

  it("still serves a valid request after a run of rejected ones", async () => {
    generateContent.mockResolvedValue(
      geminiJson({ summaryBullets: ["One.", "Two.", "Three."] })
    );

    await request(server).post("/analyze").send({ text: 123 });
    await request(server)
      .post("/analyze")
      .set("Content-Type", "application/json")
      .send('{"text": ');
    await request(server).post("/explain").send({ clause: ["x"] });
    await request(server).post("/qa").send({ question: {}, text: 5 });
    expect(generateContent).not.toHaveBeenCalled();

    const analyze = await request(server).post("/analyze").send({ text: LEASE });
    expect(analyze.status).toBe(200);
    expect(analyze.body.summaryBullets).toEqual(["One.", "Two.", "Three."]);
    expect(generateContent).toHaveBeenCalledTimes(1);

    const explain = await request(server).post("/explain").send({ clause: CLAUSE });
    expect(explain.status).toBe(200);
    const qa = await request(server).post("/qa").send({ question: QUESTION, text: LEASE });
    expect(qa.status).toBe(200);
    await expectStillHealthy();
  });
});
