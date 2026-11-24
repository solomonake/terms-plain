import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The Gemini SDK is replaced for this whole file, so no request can reach
// the real API. These tests only send GET /health and browser pre-checks.
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: vi.fn() };
  },
}));

import { createApp } from "./app";

const LIVE_ORIGINS = [
  "https://www.termsplain.com",
  "https://termsplain.com",
  "https://terms-plain.vercel.app",
];

// What a browser sends before it posts JSON to another origin.
const preCheck = (origin: string) =>
  request(createApp())
    .options("/analyze")
    .set("Origin", origin)
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "content-type");

const allowedOriginFor = async (origin: string) => {
  const response = await preCheck(origin);
  return response.headers["access-control-allow-origin"];
};

describe("which browser origins the backend accepts", () => {
  const original = process.env.FRONTEND_URL;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = original;
    }
    vi.restoreAllMocks();
  });

  describe("with FRONTEND_URL unset", () => {
    beforeEach(() => {
      delete process.env.FRONTEND_URL;
    });

    it.each(LIVE_ORIGINS)("accepts the live site at %s", async (origin) => {
      expect(await allowedOriginFor(origin)).toBe(origin);
    });

    it("still accepts the local frontend", async () => {
      expect(await allowedOriginFor("http://localhost:3000")).toBe(
        "http://localhost:3000"
      );
    });

    it("refuses any other site", async () => {
      expect(
        await allowedOriginFor("https://not-termsplain.example")
      ).toBeUndefined();
    });

    it("answers a plain health check from the live site", async () => {
      const response = await request(createApp())
        .get("/health")
        .set("Origin", "https://www.termsplain.com");
      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://www.termsplain.com"
      );
    });
  });

  describe("with FRONTEND_URL set", () => {
    it("accepts that origin and the live site, but not localhost", async () => {
      process.env.FRONTEND_URL = "https://staging.termsplain.example";
      expect(await allowedOriginFor("https://staging.termsplain.example")).toBe(
        "https://staging.termsplain.example"
      );
      expect(await allowedOriginFor("https://www.termsplain.com")).toBe(
        "https://www.termsplain.com"
      );
      expect(await allowedOriginFor("http://localhost:3000")).toBeUndefined();
    });

    it("accepts a comma-separated list and ignores spaces and a trailing slash", async () => {
      process.env.FRONTEND_URL =
        " https://a.termsplain.example/ , https://b.termsplain.example ";
      expect(await allowedOriginFor("https://a.termsplain.example")).toBe(
        "https://a.termsplain.example"
      );
      expect(await allowedOriginFor("https://b.termsplain.example")).toBe(
        "https://b.termsplain.example"
      );
    });

    it("treats a blank value like an unset one", async () => {
      process.env.FRONTEND_URL = "   ";
      expect(await allowedOriginFor("http://localhost:3000")).toBe(
        "http://localhost:3000"
      );
      expect(await allowedOriginFor("https://www.termsplain.com")).toBe(
        "https://www.termsplain.com"
      );
    });
  });
});
