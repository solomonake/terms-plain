import { Router, Request, Response } from "express";
import { analyzeHandler } from "./handlers/analyze";
import { explainHandler } from "./handlers/explain";
import { qaHandler } from "./handlers/qa";
import { forwardErrors } from "./middleware/errorHandler";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

router.post("/analyze", forwardErrors(analyzeHandler));

router.post("/explain", forwardErrors(explainHandler));

router.post("/qa", forwardErrors(qaHandler));

export default router;
