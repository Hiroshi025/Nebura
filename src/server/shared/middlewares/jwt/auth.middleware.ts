import { NextFunction, Request, Response } from "express";

import { main } from "@/main";

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

export const isCustomer = async (req: Request, res: Response, next: NextFunction) => {
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

    const isCustomer = data.role === "customer" || data.role === "owner";
    if (!isCustomer) {
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
    console.error("Customer check error:", error);
    return res.status(500).json({
      success: false,
      error: {
        message: "Internal server error during customer check",
        timestamp: new Date().toISOString(),
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
}