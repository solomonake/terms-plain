import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response) => Promise<unknown>;

// Express 4 does not catch a rejected promise from an async handler. Left
// alone, the rejection is unhandled and Node stops the whole process. This
// wrapper hands the failure to the error handler below instead.
export const forwardErrors =
  (handler: AsyncRouteHandler): RequestHandler =>
  (req, res, next) => {
    handler(req, res).catch(next);
  };

// Errors raised by the JSON body parser carry a `type` and an HTTP status.
const bodyParserFailure = (
  err: unknown
): { type: string; status: number } | null => {
  if (typeof err !== "object" || err === null) {
    return null;
  }
  const { type, status } = err as { type?: unknown; status?: unknown };
  if (typeof type !== "string" || typeof status !== "number") {
    return null;
  }
  if (status < 400 || status > 499) {
    return null;
  }
  return { type, status };
};

const messageFor = (type: string): string => {
  if (type === "entity.too.large") {
    return "Request body is too large.";
  }
  if (type === "entity.parse.failed") {
    return "Request body must be valid JSON.";
  }
  return "Request body could not be read.";
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }

  const rejectedBody = bodyParserFailure(err);
  if (rejectedBody) {
    // Log the kind of failure only. The parser attaches the raw request body
    // to its error, and that body can be a person's lease text.
    console.warn(`Rejected request body: ${rejectedBody.type}`);
    return res
      .status(rejectedBody.status)
      .json({ error: messageFor(rejectedBody.type) });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
}
