import express from "express";
import cors from "cors";
import routes from "./routes";
import { createRateLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";

// Where the live site is served from. These are always accepted, so the site
// keeps working even if FRONTEND_URL is missing on the host.
const LIVE_SITE_ORIGINS = [
  "https://www.termsplain.com",
  "https://termsplain.com",
  "https://terms-plain.vercel.app",
];

const LOCAL_FRONTEND_ORIGIN = "http://localhost:3000";

// FRONTEND_URL may hold one origin or a comma-separated list. When it is
// unset or blank, the local frontend is accepted instead.
export function allowedOrigins(frontendUrl = process.env.FRONTEND_URL) {
  const configured = (frontendUrl ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter((origin) => origin.length > 0);
  const extra = configured.length > 0 ? configured : [LOCAL_FRONTEND_ORIGIN];
  return Array.from(new Set([...LIVE_SITE_ORIGINS, ...extra]));
}

// Builds the Express app without starting it, so tests can exercise the same
// middleware order that production uses. src/server.ts only calls listen.
export function createApp() {
  const app = express();

  // A request from any other origin gets no CORS header, so browsers block it.
  app.use(
    cors({
      origin: allowedOrigins(),
    })
  );

  app.use(express.json({ limit: "2mb" }));

  // Logging requests
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Rate limiter for certain routes
  const limiter = createRateLimiter();
  app.post(["/analyze", "/explain", "/qa"], limiter);

  // API routes
  app.use(routes);

  // Must stay last: turns parser rejections into 4xx answers and anything
  // unexpected into a plain 500.
  app.use(errorHandler);

  return app;
}
