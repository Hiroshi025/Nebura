import { NextFunction, Request, Response } from "express";

import { getToken } from "@/backend/utils/token";

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

// Constantes para mensajes de error
const ERROR_MESSAGES = {
  TOKEN_NOT_FOUND: "Authorization token not found in headers",
  INVALID_TOKEN: "Invalid or expired authentication token",
  SERVER_ERROR: "Authentication service unavailable"
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.TOKEN_NOT_FOUND,
          timestamp: new Date().toISOString()
        }
      });
    }

    const user = await getToken(token);
    if (!user) {
      return res.status(403).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_TOKEN,
          timestamp: new Date().toISOString()
        }
      });
    }

    req.user = user;
    next();
    return;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[Auth Middleware Error]: ${errorMessage}`);
    
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.SERVER_ERROR,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      //requestId: req.id Asumiendo que tienes un request ID
      }
    });
  }
  return;
};