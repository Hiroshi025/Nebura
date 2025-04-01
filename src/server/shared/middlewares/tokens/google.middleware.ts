import * as crypto from "crypto";
import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "@/typings/package/gemini.interface";

export const validateTokenAI = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-gemini-api-key"] as string;
  const model = req.headers["x-gemini-model"] as string;

  if (!apiKey || !model) {
    return res.status(400).json({
      data: null,
      error: "Missing required headers: x-gemini-api-key and x-gemini-model",
    });
  }

  const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  req.geminiConfig = {
    apiKey,
    model,
    apiKeyHash,
  };

  next();
  return;
};
