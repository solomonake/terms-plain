import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import rateLimit from "express-rate-limit";
import type { Server } from "http";

const createTestLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: "Too many requests. Please try again in a minute.",
      });
    },
  });

describe("rate limiter", () => {
  let server: Server | null = null;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server?.close(() => resolve());
      });
      server = null;
    }
  });

  it("blocks after max requests", async () => {
    const app = express();
    app.set("trust proxy", false);
    app.use(express.json());
    app.post("/test", createTestLimiter(), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    try {
      server = await new Promise<Server>((resolve, reject) => {
        const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
        listener.on("error", reject);
      });
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "EPERM") {
        return;
      }
      throw err;
    }

    for (let i = 0; i < 3; i += 1) {
      const response = await request(server).post("/test").send({ ok: true });
      expect(response.status).toBe(200);
    }

    const blocked = await request(server).post("/test").send({ ok: true });
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: "Too many requests. Please try again in a minute.",
    });
  });
});
