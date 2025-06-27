"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="037b18d9-e851-5747-8e3b-68ecb58b77ac")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordController = void 0;
const discord_service_1 = require("../../../../application/services/utilities/discord.service");
/**
 * Controller for handling Discord status, updates, and incidents endpoints.
 *
 * Provides methods to fetch the current Discord status, recent updates, and incidents,
 * both for HTTP endpoints and for internal use.
 *
 * @remarks
 * This controller interacts with the DiscordService to retrieve data from Discord's status API.
 *
 * @example
 * const controller = new DiscordController();
 * app.get('/discord/status', controller.getStatus);
 */
class DiscordController extends discord_service_1.DiscordService {
    constructor() {
        super();
    }
    /**
     * Express route handler to get the current Discord status.
     *
     * Responds with a JSON object containing the mapped status, message, and last update timestamp.
     * Handles errors by returning a localized error message.
     *
     * @param req - Express Request object, extended with translation function.
     * @param res - Express Response object.
     * @returns {Promise<void>} Sends a JSON response with the current Discord status.
     */
    getStatus = async (req, res) => {
        try {
            const status = await this.getCurrentStatus();
            const output = {
                status: this.mapStatusIndicator(status.indicator),
                message: status.description,
                lastUpdated: status.lastUpdated.toISOString(),
            };
            res.status(200).json(output);
        }
        catch (error) {
            res.status(500).json({ error: req.t("errors:failed_to_fetch_discord_status") });
        }
    };
    /**
     * Express route handler to get the latest Discord updates.
     *
     * Responds with a JSON array of update objects, each containing title, summary, link, date, and type.
     * Handles errors by returning a localized error message.
     *
     * @param req - Express Request object, extended with translation function.
     * @param res - Express Response object.
     * @returns {Promise<void>} Sends a JSON response with the latest Discord updates.
     */
    getUpdates = async (req, res) => {
        try {
            const updates = await this.getLatestUpdates();
            const output = updates.map((update) => ({
                title: update.title,
                summary: update.description,
                link: update.url,
                date: update.date.toISOString(),
                type: update.type,
            }));
            res.status(200).json(output);
        }
        catch (error) {
            res.status(500).json({ error: req.t("errors:failed_to_fetch_discord_updates") });
        }
    };
    /**
     * Express route handler to get the current active Discord incidents.
     *
     * Responds with a JSON array of incident objects, each containing title, summary, link, date, and type.
     * Handles errors by returning a localized error message.
     *
     * @param req - Express Request object, extended with translation function.
     * @param res - Express Response object.
     * @returns {Promise<void>} Sends a JSON response with the current Discord incidents.
     */
    getIncidents = async (req, res) => {
        try {
            const incidents = await this.getActiveIncidents();
            const output = incidents.map((incident) => ({
                title: incident.title,
                summary: incident.description,
                link: incident.url,
                date: incident.date.toISOString(),
                type: "incident",
            }));
            res.status(200).json(output);
        }
        catch (error) {
            res.status(500).json({ error: req.t("errors:failed_to_fetch_discord_incidents") });
        }
    };
    /**
     * Retrieves the most recent Discord status for internal use.
     *
     * @returns {Promise<DiscordStatusOutputDTO>} The current Discord status object.
     */
    getRecentStatus = async () => {
        const status = await this.getCurrentStatus();
        return {
            status: this.mapStatusIndicator(status.indicator),
            message: status.description,
            lastUpdated: status.lastUpdated.toISOString(),
        };
    };
    /**
     * Retrieves the most recent Discord updates from the last 24 hours for internal use.
     *
     * @returns {Promise<DiscordUpdateOutputDTO[]>} Array of recent update objects.
     */
    getRecentUpdates = async () => {
        const updates = await this.getLatestUpdates();
        const recentUpdates = updates.filter((update) => {
            const now = new Date();
            const diff = now.getTime() - update.date.getTime();
            return diff <= 24 * 60 * 60 * 1000; // Últimas 24 horas
        });
        return recentUpdates.map((update) => ({
            title: update.title,
            summary: update.description,
            link: update.url,
            date: update.date.toISOString(),
            type: update.type,
        }));
    };
    /**
     * Retrieves the most recent Discord incidents from the last 24 hours for internal use.
     *
     * @returns {Promise<DiscordUpdateOutputDTO[]>} Array of recent incident objects.
     */
    getRecentIncidents = async () => {
        const incidents = await this.getActiveIncidents();
        const recentIncidents = incidents.filter((incident) => {
            const now = new Date();
            const diff = now.getTime() - incident.date.getTime();
            return diff <= 24 * 60 * 60 * 1000; // Últimas 24 horas
        });
        return recentIncidents.map((incident) => ({
            title: incident.title,
            summary: incident.description,
            link: incident.url,
            date: incident.date.toISOString(),
            type: "incident",
        }));
    };
    /**
     * Maps a Discord status indicator string to a standardized status value.
     *
     * @param indicator - The status indicator from Discord ("none", "minor", "major", "critical").
     * @returns {"operational" | "degraded" | "outage"} The mapped status value.
     */
    mapStatusIndicator(indicator) {
        switch (indicator) {
            case "none":
                return "operational";
            case "minor":
                return "degraded";
            case "major":
            case "critical":
            default:
                return "outage";
        }
    }
}
exports.DiscordController = DiscordController;
//# sourceMappingURL=discord.controller.js.map
//# debugId=037b18d9-e851-5747-8e3b-68ecb58b77ac
