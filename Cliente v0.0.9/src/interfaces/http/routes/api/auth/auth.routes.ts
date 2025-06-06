// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { authenticateToken } from "@/interfaces/http/middlewares/jwt/token.middleware";
import { RateLimitManager } from "@/interfaces/messaging/broker/rateLimit";
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

  /**
   * Obtiene el perfil de usuario por ID.
   * Endpoint: GET /api/v1/auth/:id
   * Requiere autenticación mediante token JWT.
   * Aplica un límite de 10 solicitudes por minuto.
   */
  app.get(
    formatRoute("/:id"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    controller.getUserProfile.bind(controller),
  );

  /**
   * Registra un nuevo usuario.
   * Endpoint: POST /api/v1/auth/register
   * No requiere autenticación.
   * Aplica un límite de 10 solicitudes por minuto.
   */
  app.post(
    formatRoute("/register"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    controller.register.bind(controller),
  );

  /**
   * Inicia sesión de usuario.
   * Endpoint: POST /api/v1/auth/login
   * No requiere autenticación.
   * Aplica un límite de 10 solicitudes por minuto.
   */
  app.post(
    formatRoute("/login"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    controller.login.bind(controller),
  );
};
