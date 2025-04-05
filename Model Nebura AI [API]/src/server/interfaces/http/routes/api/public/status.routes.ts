// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { Request, Response } from "express";

import { IPBlocker } from "@/shared/ipBlocker";
import { RateLimitManager } from "@/shared/rateLimit";
import { TRoutesInput } from "@/typings/utils";

import { StatusController } from "../../../controllers/public/status.controller";

// Constantes para paths base y versionado
const BASE_PATH = "/public";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  const status = new StatusController();

  app.get(
    formatRoute("/status"),
    RateLimitManager.getInstance().createCustomLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // Limit each IP to 100 requests per windowMs
      message: "Too many requests, please try again later.",
      handler: async (req: Request, res: Response) => {
        const ip = req.ip || req.socket.remoteAddress;
        if (ip) {
          await RateLimitManager.getInstance().recordRateLimitViolation(ip, req.path);
          const violationCount = await RateLimitManager.getInstance().getViolationCount(ip);
          if (violationCount >= 3) {
            await IPBlocker.getInstance().blockIP(
              ip,
              "system",
              `Automatic block due to ${violationCount} rate limit violations`,
              new Date(Date.now() + 24 * 60 * 60 * 1000), // Block for 24 hours
            );
          }
        }
        res.status(429).json({
          success: false,
          error: "Too many requests",
          message: "You have exceeded the request limit",
        });
      },
    }),
    IPBlocker.getInstance().getMiddleware(),
    status.getStatus,
  );
};
