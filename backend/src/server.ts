import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { createRateLimiter } from "./middleware/rateLimit";


const app = express();
const PORT = 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json({ limit: "2mb" }));

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

const limiter = createRateLimiter();
app.post(["/analyze", "/explain", "/qa"], limiter);

app.use(routes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Termsplain API running on http://localhost:${PORT}`);
});
