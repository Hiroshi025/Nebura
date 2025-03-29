import { NextFunction, Request, Response } from "express";

import { main } from "@/main";
import { safeCompare } from "@/server/shared/utils/functions";
import { getToken } from "@/server/shared/utils/token";
import { config } from "@/shared/utils/config";

const ERROR_MESSAGES = {
  TOKEN_NOT_FOUND: "Authorization token not found in headers",
  INVALID_TOKEN: "Invalid or expired authentication token",
  SERVER_ERROR: "Authentication service unavailable",
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.TOKEN_NOT_FOUND,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const user = await getToken(token);
    if (!user) {
      return res.status(403).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_TOKEN,
          timestamp: new Date().toISOString(),
        },
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
      },
    });
  }
  return;
};

export const isAdminToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const secretAdmin = config.environments.default["key-secrets"].administrator;
    const user = req.user;

    const UNAUTHORIZED_ERROR = {
      message: "Unauthorized: Authentication required",
      timestamp: new Date().toISOString(),
      code: "UNAUTHORIZED",
    };

    const FORBIDDEN_ERROR = {
      message: "Forbidden: Insufficient privileges",
      timestamp: new Date().toISOString(),
      code: "FORBIDDEN",
    };

    // Verify user is authenticated
    if (!user) {
      return res.status(401).json({
        success: false,
        error: UNAUTHORIZED_ERROR,
      });
    }

    // Check for admin secret header
    const headerSecret = Array.isArray(req.headers["x-secret-admin"])
      ? req.headers["x-secret-admin"][0]
      : req.headers["x-secret-admin"];
    if (!headerSecret) {
      return res.status(403).json({
        success: false,
        error: FORBIDDEN_ERROR,
      });
    }

    // Secure comparison to prevent timing attacks
    if (!safeCompare(headerSecret, secretAdmin)) {
      return res.status(403).json({
        success: false,
        error: FORBIDDEN_ERROR,
      });
    }

    // If all checks pass, proceed
    next();
    return;
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({
      success: false,
      error: {
        message: "Internal server error during authorization check",
        timestamp: new Date().toISOString(),
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
};

export const isDevelopment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await main.prisma.userAPI.findUnique({ where: { id: req.user.id } });
    if (!data) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized: Authentication required",
          timestamp: new Date().toISOString(),
          code: "UNAUTHORIZED",
        },
      });
    }

    const isDev = data.role === "developer" || data.role === "owner";
    if (!isDev) {
      return res.status(403).json({
        success: false,
        error: {
          message: "Forbidden: Insufficient privileges",
          timestamp: new Date().toISOString(),
          code: "FORBIDDEN",
        },
      });
    }

    next();
    return;
  } catch (error) {
    console.error("Development check error:", error);
    return res.status(500).json({
      success: false,
      error: {
        message: "Internal server error during development check",
        timestamp: new Date().toISOString(),
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await main.prisma.userAPI.findUnique({ where: { id: req.user.id } });
    if (!data) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized: Authentication required",
          timestamp: new Date().toISOString(),
          code: "UNAUTHORIZED",
        },
      });
    }

    const isAdmin = data.role === "admin" || data.role === "owner";
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          message: "Forbidden: Insufficient privileges",
          timestamp: new Date().toISOString(),
          code: "FORBIDDEN",
        },
      });
    }

    next();
    return;
    return;
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({
      success: false,
      error: {
        message: "Internal server error during admin check",
        timestamp: new Date().toISOString(),
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
};
