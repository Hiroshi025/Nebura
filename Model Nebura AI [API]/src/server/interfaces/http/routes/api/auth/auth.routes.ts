// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { authenticateToken } from "@/server/shared/middlewares/jwt/token.middleware";
import { RateLimitManager } from "@/shared/rateLimitMiddlware";
import { TRoutesInput } from "@/typings/utils";

import { AuthController } from "../../../controllers/auth/auth.controllers";

// Constantes para paths base y versionado
const BASE_PATH = "/auth";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  const controller = new AuthController();
  // Agrupar rutas relacionadas
  app.get(
    formatRoute("/:id"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    controller.getUserProfile,
  );

  app.post(
    formatRoute("/register"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    controller.register,
  );
  app.post(
    formatRoute("/login"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    controller.login,
  );
};
