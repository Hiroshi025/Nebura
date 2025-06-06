// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { isCustomerToken } from "@/interfaces/http/middlewares/jwt/token.middleware";
import { validateTokenAI } from "@/interfaces/http/middlewares/tokens/google.middleware";
import { RateLimitManager } from "@/shared/class/rateLimit";
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
  /**
   * Procesa texto utilizando el modelo de IA.
   * Método: POST
   * Ruta: /api/v1/service/google/model-ai/text
   * Middleware: RateLimitManager, isCustomerToken, validateTokenAI
   * Controlador: GeminiController.processText
   * Descripción: Permite procesar texto con el modelo de IA de Google.
   */
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

  /**
   * Procesa un archivo utilizando el modelo de IA.
   * Método: POST
   * Ruta: /api/v1/service/google/model-ai/file
   * Middleware: RateLimitManager, isCustomerToken, validateTokenAI
   * Controlador: GeminiController.processFile
   * Descripción: Permite procesar un archivo con el modelo de IA de Google.
   */
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

  /**
   * Procesa texto y archivos combinados utilizando el modelo de IA.
   * Método: POST
   * Ruta: /api/v1/service/google/model-ai/advanced
   * Middleware: RateLimitManager, isCustomerToken, validateTokenAI
   * Controlador: GeminiController.processCombined
   * Descripción: Permite procesar texto y archivos combinados con el modelo de IA de Google.
   */
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
