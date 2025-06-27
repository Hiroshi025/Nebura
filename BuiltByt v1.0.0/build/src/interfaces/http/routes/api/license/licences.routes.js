"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="f349634e-a102-5532-83fe-aa5ae708e26d")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const token_middleware_1 = require("../../../../../interfaces/http/middlewares/jwt/token.middleware");
const license_1 = require("../../../../../interfaces/messaging/broker/license");
const rateLimit_1 = require("../../../../../interfaces/messaging/broker/rateLimit");
const devs_controllers_1 = require("../../../controllers/admin/devs.controllers");
const license_controllers_1 = require("../../../controllers/license/license.controllers");
const auth_middleware_1 = require("../../../middlewares/jwt/auth.middleware");
const BASE_PATH = "/license";
const API_VERSION = "/api/v1";
const formatRoute = (path) => `${API_VERSION}${BASE_PATH}${path}`;
exports.default = ({ app }) => {
    const controller = new license_controllers_1.LicenseController();
    const security = new devs_controllers_1.SecurityController();
    // Rutas de Administración (requieren autenticación y rol admin)
    /**
     * Endpoint para crear una nueva licencia.
     * Requiere autenticación y rol de administrador.
     */
    app.post(formatRoute("/"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isAdmin, controller.create.bind(controller));
    /**
     * Endpoint para actualizar una licencia existente por su ID.
     * Requiere autenticación y rol de administrador.
     */
    app.put(formatRoute("/:id"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isAdmin, controller.update.bind(controller));
    /**
     * Endpoint para eliminar una licencia existente por su ID.
     * Requiere autenticación y rol de administrador.
     */
    app.delete(formatRoute("/:id"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isAdmin, controller.delete.bind(controller));
    // Rutas protegidas (solo autenticación)
    /**
     * Endpoint para obtener todas las licencias.
     * Requiere autenticación y rol de administrador.
     */
    app.get(formatRoute("/"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, auth_middleware_1.isAdmin, controller.getAll.bind(controller));
    /**
     * Endpoint para obtener una licencia específica por su ID.
     * Requiere autenticación.
     */
    app.get(formatRoute("/:id"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, controller.getById.bind(controller));
    /**
     * Endpoint para obtener todas las licencias asociadas a un usuario específico.
     * Requiere autenticación.
     */
    app.get(formatRoute("/user/:userId"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, controller.getByUser.bind(controller));
    /**
     * Endpoint público para validar una licencia mediante su clave.
     * No requiere autenticación.
     */
    app.post(formatRoute("/validate/:key"), license_1.LicenseIPMiddleware.getInstance().getMiddleware(), controller.validate.bind(controller));
    /**
     * Obtiene información sobre una licencia específica.
     * Método: GET
     * Ruta: /api/v1/security/license-info/:licenseKey
     * Middleware: authenticateToken
     * Controlador: security.getLicenseInfo
     * Descripción: Devuelve información sobre una licencia utilizando su clave.
     */
    app.get(formatRoute("/info/:licenseKey"), rateLimit_1.RateLimitManager.getInstance().createCustomLimiter({
        max: 10,
        windowMs: 60 * 1000, // 1 minuto
        message: "Too many requests, please try again later.",
    }), token_middleware_1.authenticateToken, security.getLicenseInfo);
};
//# sourceMappingURL=licences.routes.js.map
//# debugId=f349634e-a102-5532-83fe-aa5ae708e26d
