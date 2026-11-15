import express from "express";
import cors from "cors";
import routes from "./routes";
import { createRateLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";

// Builds the Express app without starting it, so tests can exercise the same
// middleware order that production uses. src/server.ts only calls listen.
export function createApp() {
  const app = express();

  // CORS: allow localhost in dev, or frontend URL in production
  const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";
  app.use(
    cors({
      origin: allowedOrigin,
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
