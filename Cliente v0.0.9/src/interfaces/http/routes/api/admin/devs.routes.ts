// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { Request, Response } from "express";

import { isDevelopment } from "@/interfaces/http/middlewares/jwt/auth.middleware";
import {
	authenticateToken, isAdminToken
} from "@/interfaces/http/middlewares/jwt/token.middleware";
import { main } from "@/main";
import { RateLimitManager } from "@/shared/class/rateLimit";
import { TRoutesInput } from "@/typings/utils";

import { SecurityController } from "../../../controllers/admin/devs.controllers";

// Constantes para paths base y versionado
const BASE_PATH = "/admin";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;

export default ({ app }: TRoutesInput) => {
  const security = new SecurityController();

  /**
   * Retrieves information about a specific IP address.
   * Method: GET
   * Route: /api/v1/security/ip-info/:ipAddress
   * Middleware: authenticateToken
   * Controller: security.getIpInfo
   * Description: Returns detailed information about an IP address.
   */
  app.get(
    formatRoute("/ip-info/:ipAddress"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isDevelopment,
    security.getIpInfo,
  );

  /**
   * Retrieves cache performance metrics.
   * Method: GET
   * Route: /api/v1/admin/cache-performance
   * Middleware: authenticateToken, isDevelopment
   * Controller: security.cacheInfo
   * Description: Returns performance metrics related to the cache.
   */
  app.get(
    formatRoute("/cache-performance"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isDevelopment,
    security.cacheInfo,
  );

  /**
   * Retrieves the current cache index.
   * Method: GET
   * Route: /api/v1/admin/cache-index
   * Middleware: authenticateToken, isDevelopment
   * Controller: security.cacheIndex
   * Description: Returns the current cache index.
   */
  app.get(
    formatRoute("/cache-index"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isDevelopment,
    security.cacheIndex,
  );

  app.get(
    formatRoute("/prisma-metrics"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    isAdminToken,
    async (_req: Request, res: Response) => {
      const prismaMetrics = await main.prisma.metrics.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });

      return res.status(200).json({
        success: true,
        data: prismaMetrics,
      });
    },
  );
};
