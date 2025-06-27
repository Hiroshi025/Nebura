"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="9727ffb4-1a1b-591b-9a95-04fadac538e4")}catch(e){}}();

// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const token_middleware_1 = require("../../../../../interfaces/http/middlewares/jwt/token.middleware");
const rateLimit_1 = require("../../../../../interfaces/messaging/broker/rateLimit");
const ip_controllers_1 = __importDefault(require("../../../controllers/admin/ip.controllers"));
const auth_middleware_1 = require("../../../middlewares/jwt/auth.middleware");
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
    /**
     * Desbloquea una dirección IP específica.
     * Método: DELETE
     * Ruta: /api/v1/admin/unblock-ip/:ipAddress
     * Middleware: authenticateToken, isAdmin
     * Controlador: ipBlockerControllers.unblockIP
     * Descripción: Permite a un administrador eliminar el bloqueo de una dirección IP específica.
     */
    app.delete(formatRoute("/unblock-ip/:ipAddress"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isAdmin, ip_controllers_1.default.unblockIP);
    /**
     * Lista todas las direcciones IP bloqueadas.
     * Método: GET
     * Ruta: /api/v1/admin/blocked-ips
     * Middleware: authenticateToken, isAdmin
     * Controlador: ipBlockerControllers.listBlockedIPs
     * Descripción: Devuelve una lista de todas las direcciones IP que están actualmente bloqueadas.
     */
    app.get(formatRoute("/blocked-ips"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isAdmin, ip_controllers_1.default.listBlockedIPs);
    /**
     * Bloquea una dirección IP específica.
     * Método: POST
     * Ruta: /api/v1/admin/block-ip
     * Middleware: authenticateToken, isAdmin
     * Controlador: ipBlockerControllers.blockIP
     * Descripción: Permite a un administrador bloquear una dirección IP específica.
     */
    app.post(formatRoute("/block-ip"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isAdmin, ip_controllers_1.default.blockIP);
};
//# sourceMappingURL=ips.routes.js.map
//# debugId=9727ffb4-1a1b-591b-9a95-04fadac538e4
