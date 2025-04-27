"use strict";
// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("../../../../../../server/shared/middlewares/jwt/auth.middleware");
const token_middleware_1 = require("../../../../../../server/shared/middlewares/jwt/token.middleware");
const rateLimit_1 = require("../../../../../../shared/class/rateLimit");
const devs_controllers_1 = require("../../../controllers/admin/devs.controllers");
// Constantes para paths base y versionado
const BASE_PATH = "/admin";
const API_VERSION = "/api/v1";
/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path) => `${API_VERSION}${BASE_PATH}${path}`;
exports.default = ({ app }) => {
    const security = new devs_controllers_1.SecurityController();
    /**
     * Retrieves information about a specific IP address.
     * Method: GET
     * Route: /api/v1/security/ip-info/:ipAddress
     * Middleware: authenticateToken
     * Controller: security.getIpInfo
     * Description: Returns detailed information about an IP address.
     */
    app.get(formatRoute("/ip-info/:ipAddress"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isDevelopment, security.getIpInfo);
    /**
     * Retrieves cache performance metrics.
     * Method: GET
     * Route: /api/v1/admin/cache-performance
     * Middleware: authenticateToken, isDevelopment
     * Controller: security.cacheInfo
     * Description: Returns performance metrics related to the cache.
     */
    app.get(formatRoute("/cache-performance"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isDevelopment, security.cacheInfo);
    /**
     * Retrieves the current cache index.
     * Method: GET
     * Route: /api/v1/admin/cache-index
     * Middleware: authenticateToken, isDevelopment
     * Controller: security.cacheIndex
     * Description: Returns the current cache index.
     */
    app.get(formatRoute("/cache-index"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isDevelopment, security.cacheIndex);
};
