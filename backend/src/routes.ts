import { Router, Request, Response } from "express";
import { analyzeHandler } from "./handlers/analyze";
import { explainHandler } from "./handlers/explain";
import { qaHandler } from "./handlers/qa";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

router.post("/analyze", analyzeHandler);

router.post("/explain", explainHandler);

router.post("/qa", qaHandler);

export default router;
