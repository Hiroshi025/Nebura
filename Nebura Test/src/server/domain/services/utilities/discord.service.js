"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordService = void 0;
// src/services/discord.service.ts
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const discord_entity_1 = require("../../entitys/discord.entity");
class DiscordService {
    STATUS_API_URL = process.env.STATUS_API_URL;
    BLOG_URL = process.env.BLOG_URL;
    STATUS_PAGE_URL = process.env.STATUS_PAGE_URL;
    async getCurrentStatus() {
        try {
            const response = await axios_1.default.get(this.STATUS_API_URL);
            return new discord_entity_1.DiscordStatusEntity(response.data.status.indicator, response.data.status.description, new Date(response.data.page.updated_at));
        }
        catch (error) {
            console.error("Error fetching Discord status:", error);
            return new discord_entity_1.DiscordStatusEntity("critical", "Failed to fetch status", new Date());
        }
    }
    async getLatestUpdates() {
        try {
            const response = await axios_1.default.get(this.BLOG_URL);
            const $ = (0, cheerio_1.load)(response.data);
            const updates = [];
            $("article.post").each((_i, element) => {
                const title = $(element).find("h2").text().trim();
                const description = $(element).find("p").first().text().trim();
                const url = $(element).find("a").attr("href") || "";
                const dateStr = $(element).find("time").attr("datetime") || "";
                const tag = $(element).find(".post-tag").text().trim().toLowerCase();
                const type = tag.includes("announce")
                    ? "announcement"
                    : tag.includes("incident")
                        ? "incident"
                        : "update";
                if (title && description) {
                    updates.push(new discord_entity_1.DiscordUpdateEntity(title, description, url.startsWith("http") ? url : `https://discord.com${url}`, new Date(dateStr), type));
                }
            });
            return updates.sort((a, b) => b.date.getTime() - a.date.getTime());
        }
        catch (error) {
            console.error("Error fetching Discord updates:", error);
            return [];
        }
    }
    async getActiveIncidents() {
        try {
            const response = await axios_1.default.get(`${this.STATUS_PAGE_URL}/api/v2/incidents.json`);
            const incidents = response.data.incidents.filter((i) => i.status !== "resolved");
            return incidents.map((incident) => new discord_entity_1.DiscordUpdateEntity(incident.name, incident.incident_updates[0]?.description || "No description", `${this.STATUS_PAGE_URL}/incidents/${incident.id}`, new Date(incident.created_at), "incident"));
        }
        catch (error) {
            console.error("Error fetching Discord incidents:", error);
            return [];
        }
    }
}
exports.DiscordService = DiscordService;
