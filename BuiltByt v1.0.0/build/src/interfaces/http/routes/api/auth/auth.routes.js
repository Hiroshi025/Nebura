"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="cc91a8c3-3f5b-57cd-99d2-51c086da8cac")}catch(e){}}();

// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';
Object.defineProperty(exports, "__esModule", { value: true });
const token_middleware_1 = require("../../../../../interfaces/http/middlewares/jwt/token.middleware");
const rateLimit_1 = require("../../../../../interfaces/messaging/broker/rateLimit");
const auth_controllers_1 = require("../../../controllers/auth/auth.controllers");
// Constantes para paths base y versionado
const BASE_PATH = "/auth";
const API_VERSION = "/api/v1";
/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path) => `${API_VERSION}${BASE_PATH}${path}`;
exports.default = ({ app }) => {
    const controller = new auth_controllers_1.AuthController();
    // Agrupar rutas relacionadas
    /**
     * Obtiene el perfil de usuario por ID.
     * Endpoint: GET /api/v1/auth/:id
     * Requiere autenticación mediante token JWT.
     * Aplica un límite de 10 solicitudes por minuto.
     */
    app.get(formatRoute("/:id"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, controller.getUserProfile.bind(controller));
    /**
     * Registra un nuevo usuario.
     * Endpoint: POST /api/v1/auth/register
     * No requiere autenticación.
     * Aplica un límite de 10 solicitudes por minuto.
     */
    app.post(formatRoute("/register"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), controller.register.bind(controller));
    /**
     * Inicia sesión de usuario.
     * Endpoint: POST /api/v1/auth/login
     * No requiere autenticación.
     * Aplica un límite de 10 solicitudes por minuto.
     */
    app.post(formatRoute("/login"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), controller.login.bind(controller));
};
//# sourceMappingURL=auth.routes.js.map
//# debugId=cc91a8c3-3f5b-57cd-99d2-51c086da8cac
