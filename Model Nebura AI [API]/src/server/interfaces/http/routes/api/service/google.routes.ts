// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { isCustomerToken } from "@/server/shared/middlewares/jwt/token.middleware";
import { validateTokenAI } from "@/server/shared/middlewares/tokens/google.middleware";
import { RateLimitManager } from "@/shared/rateLimit";
import { TRoutesInput } from "@/typings/utils";

import { GeminiController } from "../../../controllers/asistent/google.controllers";

// Constantes para paths base y versionado
const BASE_PATH = "/service/google";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  app.post(
    formatRoute("/model-ai/text"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 8,
      windowMs: 60 * 1000,
      message: "Too many requests, please try again later.",
    }),
    isCustomerToken,
    validateTokenAI,
    GeminiController.processText,
  );
  app.post(
    formatRoute("/model-ai/file"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 8,
      windowMs: 60 * 1000,
      message: "Too many requests, please try again later.",
    }),
    isCustomerToken,
    validateTokenAI,
    GeminiController.processFile,
  );
  app.post(
    formatRoute("/model-ai/advanced"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 8,
      windowMs: 60 * 1000,
      message: "Too many requests, please try again later.",
    }),
    isCustomerToken,
    validateTokenAI,
    GeminiController.processCombined,
  );
};
