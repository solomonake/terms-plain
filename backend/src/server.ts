import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { createRateLimiter } from "./middleware/rateLimit";

const app = express();

// Use the Render-provided port or fallback to 4000 for local dev
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

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

// Error handler
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Termsplain API running on port ${PORT}`);
});
