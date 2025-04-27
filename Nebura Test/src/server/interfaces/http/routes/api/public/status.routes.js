"use strict";
// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';
Object.defineProperty(exports, "__esModule", { value: true });
const ipBlocker_1 = require("../../../../../../shared/class/ipBlocker");
const rateLimit_1 = require("../../../../../../shared/class/rateLimit");
const discord_controller_1 = require("../../../controllers/public/discord.controller");
const status_controller_1 = require("../../../controllers/public/status.controller");
// Constantes para paths base y versionado
const BASE_PATH = "/public";
const API_VERSION = "/api/v1";
/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path) => `${API_VERSION}${BASE_PATH}${path}`;
exports.default = ({ app }) => {
    const discordController = new discord_controller_1.DiscordController();
    const status = new status_controller_1.StatusController();
    /**
     * Obtiene el estado general del sistema.
     * Método: GET
     * Ruta: /api/v1/public/status
     * Middleware: RateLimitManager, IPBlocker
     * Controlador: status.getStatus
     * Descripción: Devuelve el estado general del sistema.
     */
    app.get(formatRoute("/status"), rateLimit_1.RateLimitManager.getInstance().getDefaultLimiter(), ipBlocker_1.IPBlocker.getInstance().getMiddleware(), status.getStatus);
    /**
     * Obtiene el estado del servicio de Discord.
     * Método: GET
     * Ruta: /api/v1/public/discord/status
     * Middleware: RateLimitManager, IPBlocker
     * Controlador: discordController.getStatus
     * Descripción: Devuelve el estado actual del servicio de Discord.
     */
    app.get(formatRoute("/discord/status"), rateLimit_1.RateLimitManager.getInstance().getDefaultLimiter(), ipBlocker_1.IPBlocker.getInstance().getMiddleware(), discordController.getStatus);
    /**
     * Obtiene las actualizaciones recientes de Discord.
     * Método: GET
     * Ruta: /api/v1/public/discord/updates
     * Middleware: RateLimitManager, IPBlocker
     * Controlador: discordController.getUpdates
     * Descripción: Devuelve las actualizaciones recientes del servicio de Discord.
     */
    app.get(formatRoute("/discord/updates"), rateLimit_1.RateLimitManager.getInstance().getDefaultLimiter(), ipBlocker_1.IPBlocker.getInstance().getMiddleware(), discordController.getUpdates);
    /**
     * Obtiene los incidentes recientes de Discord.
     * Método: GET
     * Ruta: /api/v1/public/discord/incidents
     * Middleware: RateLimitManager, IPBlocker
     * Controlador: discordController.getIncidents
     * Descripción: Devuelve los incidentes recientes del servicio de Discord.
     */
    app.get(formatRoute("/discord/incidents"), rateLimit_1.RateLimitManager.getInstance().getDefaultLimiter(), ipBlocker_1.IPBlocker.getInstance().getMiddleware(), discordController.getIncidents);
    /**
     * Obtiene datos recientes de Discord (incidentes, estado y actualizaciones).
     * Método: GET
     * Ruta: /api/v1/public/discord/recent
     * Middleware: RateLimitManager, IPBlocker
     * Controlador: discordController (métodos combinados)
     * Descripción: Devuelve datos recientes del servicio de Discord, incluyendo incidentes, estado y actualizaciones.
     */
    app.get(formatRoute("/discord/recent"), rateLimit_1.RateLimitManager.getInstance().getDefaultLimiter(), ipBlocker_1.IPBlocker.getInstance().getMiddleware(), async (_req, res) => {
        try {
            const recentIncidents = await discordController.getRecentIncidents();
            const recentUpdates = await discordController.getRecentUpdates();
            const recentStatus = await discordController.getRecentStatus();
            res.status(200).json({
                data: {
                    incidents: recentIncidents,
                    status: recentStatus,
                    updates: recentUpdates,
                },
                errors: null,
            });
        }
        catch (error) {
            res.status(500).json({
                data: null,
                errors: "Failed to fetch recent Discord data",
            });
        }
    });
};
