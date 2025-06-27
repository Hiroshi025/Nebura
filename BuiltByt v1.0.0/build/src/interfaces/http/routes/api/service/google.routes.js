"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="0619e7ec-6110-5de0-a88b-b7fa3fcad17f")}catch(e){}}();

// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';
Object.defineProperty(exports, "__esModule", { value: true });
const token_middleware_1 = require("../../../../../interfaces/http/middlewares/jwt/token.middleware");
const google_middleware_1 = require("../../../../../interfaces/http/middlewares/tokens/google.middleware");
const rateLimit_1 = require("../../../../../interfaces/messaging/broker/rateLimit");
const google_controllers_1 = require("../../../controllers/asistent/google.controllers");
// Constantes para paths base y versionado
const BASE_PATH = "/service/google";
const API_VERSION = "/api/v1";
/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path) => `${API_VERSION}${BASE_PATH}${path}`;
exports.default = ({ app }) => {
    /**
     * Procesa texto utilizando el modelo de IA.
     * Método: POST
     * Ruta: /api/v1/service/google/model-ai/text
     * Middleware: RateLimitManager, isCustomerToken, validateTokenAI
     * Controlador: GeminiController.processText
     * Descripción: Permite procesar texto con el modelo de IA de Google.
     */
    app.post(formatRoute("/model-ai/text"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 8,
        windowMs: 60 * 1000,
        message: "Too many requests, please try again later.",
    }), token_middleware_1.isCustomerToken, google_middleware_1.validateTokenAI, google_controllers_1.GeminiController.processText);
    /**
     * Procesa un archivo utilizando el modelo de IA.
     * Método: POST
     * Ruta: /api/v1/service/google/model-ai/file
     * Middleware: RateLimitManager, isCustomerToken, validateTokenAI
     * Controlador: GeminiController.processFile
     * Descripción: Permite procesar un archivo con el modelo de IA de Google.
     */
    app.post(formatRoute("/model-ai/file"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 8,
        windowMs: 60 * 1000,
        message: "Too many requests, please try again later.",
    }), token_middleware_1.isCustomerToken, google_middleware_1.validateTokenAI, google_controllers_1.GeminiController.processFile);
    /**
     * Procesa texto y archivos combinados utilizando el modelo de IA.
     * Método: POST
     * Ruta: /api/v1/service/google/model-ai/advanced
     * Middleware: RateLimitManager, isCustomerToken, validateTokenAI
     * Controlador: GeminiController.processCombined
     * Descripción: Permite procesar texto y archivos combinados con el modelo de IA de Google.
     */
    app.post(formatRoute("/model-ai/advanced"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 8,
        windowMs: 60 * 1000,
        message: "Too many requests, please try again later.",
    }), token_middleware_1.isCustomerToken, google_middleware_1.validateTokenAI, google_controllers_1.GeminiController.processCombined);
};
//# sourceMappingURL=google.routes.js.map
//# debugId=0619e7ec-6110-5de0-a88b-b7fa3fcad17f
