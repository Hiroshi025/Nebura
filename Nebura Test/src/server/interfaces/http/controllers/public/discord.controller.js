"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordController = void 0;
// src/controllers/discord.controller.ts
const discord_service_1 = require("../../../../../server/domain/services/utilities/discord.service");
class DiscordController {
    discordService = new discord_service_1.DiscordService();
    getStatus = async (req, res) => {
        try {
            const status = await this.discordService.getCurrentStatus();
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
    getUpdates = async (req, res) => {
        try {
            const updates = await this.discordService.getLatestUpdates();
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
    getIncidents = async (req, res) => {
        try {
            const incidents = await this.discordService.getActiveIncidents();
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
    getRecentStatus = async () => {
        const status = await this.discordService.getCurrentStatus();
        return {
            status: this.mapStatusIndicator(status.indicator),
            message: status.description,
            lastUpdated: status.lastUpdated.toISOString(),
        };
    };
    getRecentUpdates = async () => {
        const updates = await this.discordService.getLatestUpdates();
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
    getRecentIncidents = async () => {
        const incidents = await this.discordService.getActiveIncidents();
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
