import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Starts src/server.ts as a real, separate process, the way production runs
// it, and checks that the SAME process survives every rejected request.
// GEMINI_API_KEY is set to an empty value, which the server treats as
// missing, so this file cannot reach the real API even if a local .env
// file holds a key.

const BACKEND_DIR = path.resolve(__dirname, "..");
// Made-up text. Not taken from any real lease or person.
const LEASE =
  "Sample lease between Example Landlord LLC and Sample Tenant. Rent is $900 per month, due on the first day of each month.";

const findFreePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("the server process", () => {
  let child: ChildProcess;
  let baseUrl: string;
  let output = "";

  const isRunning = () => child.exitCode === null && child.signalCode === null;

  beforeAll(async () => {
    const port = await findFreePort();
    baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(
      process.execPath,
      ["-r", "ts-node/register/transpile-only", "src/server.ts"],
      {
        cwd: BACKEND_DIR,
        env: {
          ...process.env,
          PORT: String(port),
          GEMINI_API_KEY: "",
          FRONTEND_URL: "http://localhost:3000",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    child.stdout?.on("data", (chunk) => (output += String(chunk)));
    child.stderr?.on("data", (chunk) => (output += String(chunk)));

    const deadline = Date.now() + 25000;
    while (Date.now() < deadline) {
      if (!isRunning()) {
        throw new Error(`Server process exited during startup:\n${output}`);
      }
      try {
        const health = await request(baseUrl).get("/health");
        if (health.status === 200) {
          return;
        }
      } catch {
        // Not listening yet.
      }
      await sleep(150);
    }
    throw new Error(`Server process did not start in time:\n${output}`);
  }, 30000);

  afterAll(() => {
    if (child && isRunning()) {
      child.kill();
    }
  });

  const expectAliveAndHealthy = async (after: string) => {
    expect(isRunning(), `process exited after ${after}:\n${output}`).toBe(true);
    const health = await request(baseUrl).get("/health");
    expect(health.status, `health check after ${after}`).toBe(200);
  };

  it("stays up through every kind of rejected request", async () => {
    const rejected: Array<{
      name: string;
      path: string;
      body: string;
      status: number;
    }> = [
      { name: "numeric text", path: "/analyze", body: '{"text": 123}', status: 400 },
      { name: "boolean text", path: "/analyze", body: '{"text": true}', status: 400 },
      { name: "array text", path: "/analyze", body: '{"text": ["a"]}', status: 400 },
      { name: "object text", path: "/analyze", body: '{"text": {"a": 1}}', status: 400 },
      { name: "null text", path: "/analyze", body: '{"text": null}', status: 400 },
      { name: "empty object", path: "/analyze", body: "{}", status: 400 },
      { name: "array body", path: "/analyze", body: "[1, 2]", status: 400 },
      { name: "cut off JSON", path: "/analyze", body: '{"text": "Sample', status: 400 },
      { name: "bare number body", path: "/analyze", body: "123", status: 400 },
      { name: "numeric clause", path: "/explain", body: '{"clause": 123}', status: 400 },
      { name: "object clause", path: "/explain", body: '{"clause": {}}', status: 400 },
      {
        name: "numeric question",
        path: "/qa",
        body: '{"question": 7, "text": "Sample lease."}',
        status: 400,
      },
      {
        name: "array lease text on /qa",
        path: "/qa",
        body: '{"question": "When is rent due?", "text": []}',
        status: 400,
      },
    ];

    for (const item of rejected) {
      let status: number | string;
      try {
        const response = await request(baseUrl)
          .post(item.path)
          .set("Content-Type", "application/json")
          .send(item.body);
        status = response.status;
        expect(response.body, item.name).toHaveProperty("error");
      } catch (err) {
        // A dropped connection is the old failure mode.
        status = `no response (${(err as Error).message})`;
      }
      expect(status, item.name).toBe(item.status);
      await expectAliveAndHealthy(item.name);
    }

    const tooLarge = await request(baseUrl)
      .post("/analyze")
      .send({ text: "x".repeat(2 * 1024 * 1024 + 1024) });
    expect(tooLarge.status).toBe(413);
    await expectAliveAndHealthy("a body over the size limit");

    // No key is set, so the summary is the fixed fallback and no AI call is
    // made. The point here is only that the same process still does work.
    const valid = await request(baseUrl).post("/analyze").send({ text: LEASE });
    expect(valid.status).toBe(200);
    expect(Array.isArray(valid.body.summaryBullets)).toBe(true);
    expect(Array.isArray(valid.body.flags)).toBe(true);
    await expectAliveAndHealthy("a valid request");
  }, 30000);
});
