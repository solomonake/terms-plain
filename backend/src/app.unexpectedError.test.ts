import type { Server } from "node:http";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The Gemini SDK is replaced for this whole file, so no request can reach
// the real API.
const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

// Stand-in for a bug inside a handler: the rule-based flag step throws.
vi.mock("./detectFlags", () => ({
  detectFlags: () => {
    throw new Error("stubbed internal failure INTERNAL-DETAIL-MARKER");
  },
}));

import { createApp } from "./app";

describe("an unexpected failure inside a handler", () => {
  let server: Server;

  beforeEach(async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    server = createApp().listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    vi.restoreAllMocks();
  });

  it("answers a plain 500 and the server keeps answering", async () => {
    // Made-up text. Not taken from any real lease or person.
    const response = await request(server)
      .post("/analyze")
      .send({ text: "Sample lease. Rent is $900 per month." });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
    expect(response.text).not.toContain("INTERNAL-DETAIL-MARKER");
    expect(generateContent).not.toHaveBeenCalled();

    const health = await request(server).get("/health");
    expect(health.status).toBe(200);
  });
});
