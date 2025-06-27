"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="fb557621-a652-5ff0-b86f-bc580dcd97af")}catch(e){}}();

/**
 * @fileoverview
 * This file defines the main web view routes for the Nebura Dashboard.
 * All endpoints are prefixed with `/dashboard/` and render EJS views.
 *
 * @module view.routes
 * @see {@link https://expressjs.com/en/4x/api.html#app Express Application API}
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const auth_middleware_1 = require("../../../../../interfaces/http/middlewares/web/auth.middleware");
const main_1 = require("../../../../../main");
const functions_1 = require("../../../../../shared/functions");
const config_1 = require("../../../../../shared/utils/config");
const winston_1 = require("../../../../../shared/utils/winston");
/**
 * Formats the route path with the `/dashboard/` prefix.
 * @param path - Specific endpoint path.
 * @returns The formatted route path.
 */
const formatRoute = (path) => `/dashboard/${path}`;
/**
 * Registers all Nebura Dashboard web view routes.
 *
 * @param app - Express application instance.
 * @see {@link https://expressjs.com/en/4x/api.html#app Express Application API}
 */
exports.default = ({ app }) => {
    /**
     * GET /dashboard/cdn
     *
     * Renders the CDN page.
     * Requires authentication and not in maintenance mode.
     *
     * @middleware AuthPublic
     * @middleware Maintenance
     * @route GET /dashboard/cdn
     * @returns {View} cdn.ejs
     */
    app.get(formatRoute("cdn"), auth_middleware_1.AuthPublic, auth_middleware_1.Maintenance, (req, res) => {
        return res.render("cdn.ejs", {
            title: config_1.config.project.name + " - CDN",
            user: req.user,
            cdnUrl: (0, functions_1.hostURL)(),
            sharedFile: null,
        });
    });
    /**
     * GET /dashboard/cdn/share
     *
     * Renders the shared file view for CDN.
     * Expects query parameters: title, url, mime, size, date, description.
     *
     * @route GET /dashboard/cdn/share
     * @returns {View} cdn-share.ejs
     */
    app.get(formatRoute("cdn/share"), (req, res) => {
        // Lee los parámetros de la URL
        const { title, url, mime, size, date, description } = req.query;
        // Si faltan datos mínimos, puedes mostrar un error o una vista genérica
        if (!title || !url || !mime) {
            return res.render("error.ejs", {
                title: config_1.config.project.name + " - Share",
                user: req.user,
            });
        }
        // Pasa los datos del archivo compartido a la vista
        res.render("cdn-share.ejs", {
            title: config_1.config.project.name + " - Share",
            user: req.user,
            sharedFile: {
                title: decodeURIComponent(title),
                downloadUrl: decodeURIComponent(url),
                mimeType: decodeURIComponent(mime),
                size: size ? Number(size) : 0,
                uploadedAt: date ? decodeURIComponent(date) : "",
                description: description ? decodeURIComponent(description) : "",
                shareUrl: req.protocol + "://" + req.get("host") + req.originalUrl,
            },
        });
    });
    /**
     * GET /dashboard/logout
     *
     * Renders an error page for logout (not implemented).
     *
     * @route GET /dashboard/logout
     * @returns {View} error.ejs
     */
    app.get(formatRoute("logout"), (_req, res) => {
        return res.status(500).render("error.ejs", { title: config_1.config.project.name + " - Error" });
    });
    /**
     * GET /dashboard/
     *
     * Renders the main dashboard page.
     * Requires authentication and not in maintenance mode.
     * Fetches user, license, file, and ticket data for the logged-in user.
     *
     * @middleware AuthPublic
     * @middleware Maintenance
     * @route GET /dashboard/
     * @returns {View} dashboard.ejs
     */
    app.get(formatRoute(""), auth_middleware_1.AuthPublic, auth_middleware_1.Maintenance, async (req, res) => {
        /*     const logger = await new WinstonLogger();
        const recentLogger = await logger.getRecentLogs(3); */
        const data = await main_1.main.prisma.userAPI.findMany();
        const userData = data.find((user) => user.discord?.userId === req.user.id);
        const licenseData = await main_1.main.prisma.license.findMany({
            where: { userId: req.user.id },
        });
        const fileData = await main_1.main.prisma.fileMetadata.findMany({
            where: { userId: req.user.id },
        });
        const ticketData = await main_1.main.prisma.ticketUser.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
            take: 5,
        });
        // del array de datos de fileData remueve el parametro path de cada uno
        const fileDataFilter = fileData.map(({ path, ...rest }) => rest);
        return res.render("dashboard.ejs", {
            title: config_1.config.project.name + " - Dashboard",
            user: req.user,
            userAPI: userData || null,
            fileData: fileDataFilter || null,
            ticketData: ticketData || null,
            licenseData: licenseData || null,
            //recentLogs: recentLogger,
        });
    });
    /**
     * GET /dashboard/administrator
     *
     * Renders the administrator dashboard.
     * Only accessible to users with "owner" or "developer" roles.
     * Requires query parameter: id (user ID).
     *
     * @middleware AuthPublic
     * @route GET /dashboard/administrator?id={userId}
     * @returns {View} administrator.ejs
     */
    app.get(formatRoute("administrator"), auth_middleware_1.AuthPublic, async (req, res) => {
        //la redireccion a este endpoint lo hace con '/dashboard/administrator?id=' + data.user.id;
        const userId = req.query.id;
        if (!userId) {
            return res.status(400).render("error.ejs", {
                title: config_1.config.project.name + " - Bad Request",
                user: req.user,
                error: "User ID is required",
            });
        }
        const allowedRole = ["owner", "developer"];
        const data = await main_1.main.prisma.userAPI.findUnique({
            where: { id: userId },
        });
        if (!data || !allowedRole.includes(data.role)) {
            return res.status(403).render("error.ejs", {
                title: config_1.config.project.name + " - Access Denied",
                user: req.user,
                error: "You do not have permission to access this page",
            });
        }
        const logger = await new winston_1.WinstonLogger();
        const recentLogger = await logger.getRecentLogs(5);
        const usersMap = {};
        main_1.client.users.cache.forEach((user) => {
            usersMap[user.id] = user.username; // o user.tag si quieres el tag completo
        });
        return res.render("administrator.ejs", {
            title: config_1.config.project.name + " - Administrator",
            user: req.user,
            usersMap,
            metrics: await main_1.main.prisma.metrics.findMany(),
            users: await main_1.main.prisma.userAPI.findMany(),
            licenses: await main_1.main.prisma.license.findMany(),
            myclientDiscord: await main_1.main.prisma.client.findMany(),
            userIdFromUrl: req.query.id,
            recentLogs: recentLogger,
        });
    });
    /**
     * GET /dashboard/agent
     *
     * Renders the Gemini Agent page.
     * Requires authentication and not in maintenance mode.
     *
     * @middleware AuthPublic
     * @middleware Maintenance
     * @route GET /dashboard/agent
     * @returns {View} agent.ejs
     */
    app.get(formatRoute("agent"), auth_middleware_1.AuthPublic, auth_middleware_1.Maintenance, (req, res) => {
        return res.render("agent.ejs", {
            title: config_1.config.project.name + " - Gemini",
            user: req.user,
            customer_key: process.env.CUSTOMER_SECRET,
        });
    });
    /**
     * GET /dashboard/logs/view/:name
     *
     * Renders a log file viewer for administrators.
     * Only accessible to users with "owner" or "developer" roles.
     * Requires query parameter: id (user ID).
     *
     * @middleware AuthPublic
     * @middleware Maintenance
     * @route GET /dashboard/logs/view/:name?id={userId}
     * @returns {View} logs-view.ejs
     */
    app.get(formatRoute("logs/view/:name"), auth_middleware_1.AuthPublic, auth_middleware_1.Maintenance, async (req, res) => {
        const userId = req.query.id;
        if (!userId || !/^[a-fA-F0-9]{24}$/.test(userId)) {
            return res.status(400).render("error.ejs", {
                title: config_1.config.project.name + " - Bad Request",
                user: req.user,
                error: "User ID is malformed or missing",
            });
        }
        const allowedRole = ["owner", "developer"];
        const data = await main_1.main.prisma.userAPI.findUnique({
            where: { id: userId },
        });
        if (!data || !allowedRole.includes(data.role)) {
            return res.status(403).render("error.ejs", {
                title: config_1.config.project.name + " - Access Denied",
                user: req.user,
                error: "You do not have permission to access this page",
            });
        }
        const winston = new winston_1.WinstonLogger();
        const pathDir = (0, node_path_1.join)(winston.logDir, req.params.name);
        const response = await (0, axios_1.default)({
            url: `${(0, functions_1.hostURL)()}/dashboard/utils/logs/${req.params.name}`,
            method: "GET",
        });
        if (response.status !== 200) {
            return res.status(500).render("error.ejs", {
                title: config_1.config.project.name + " - Error",
                user: req.user,
                error: "Failed to retrieve log file",
            });
        }
        const logLines = response.data;
        return res.render("logs-view.ejs", {
            logFile: pathDir,
            logLines: logLines,
            title: config_1.config.project.name + " - Logs Viewer",
            user: req.user,
            logName: req.params.name,
            logSize: await (0, node_fs_1.statSync)(pathDir).size,
            logDate: new Date().toLocaleDateString(),
            maxLogAgeDays: winston.maxLogAgeDays,
        });
    });
    /**
     * GET /dashboard/support
     *
     * Renders the support page.
     * Requires authentication and not in maintenance mode.
     *
     * @middleware AuthPublic
     * @middleware Maintenance
     * @route GET /dashboard/support
     * @returns {View} support.ejs
     */
    app.get(formatRoute("support"), auth_middleware_1.AuthPublic, auth_middleware_1.Maintenance, async (req, res) => {
        return res.render("support.ejs", {
            title: config_1.config.project.name + " - Support",
            webURL: (0, functions_1.hostURL)(),
            user: req.user,
        });
    });
    /**
     * GET /dashboard/maintenance
     *
     * Renders the maintenance page.
     * Requires authentication and not in maintenance mode.
     *
     * @middleware AuthPublic
     * @middleware Maintenance
     * @route GET /dashboard/maintenance
     * @returns {View} maintenance.ejs
     */
    app.get(formatRoute("maintenance"), auth_middleware_1.AuthPublic, auth_middleware_1.Maintenance, async (req, res) => {
        return res.render("maintenance.ejs", {
            title: config_1.config.project.name + " - Maintenance",
            user: req.user,
        });
    });
    /**
     * GET /dashboard/administrator/tickets
     *
     * Renders the tickets administration page.
     * Only accessible to users with "owner" or "developer" roles.
     * Requires query parameter: id (user ID).
     *
     * @middleware AuthPublic
     * @middleware Maintenance
     * @route GET /dashboard/administrator/tickets?id={userId}
     * @returns {View} tickets.ejs
     */
    app.get(formatRoute("administrator/tickets"), auth_middleware_1.AuthPublic, auth_middleware_1.Maintenance, async (req, res) => {
        const userId = req.query.id;
        if (!userId) {
            return res.status(400).render("error.ejs", {
                title: config_1.config.project.name + " - Bad Request",
                user: req.user,
                error: "User ID is required",
            });
        }
        const allowedRole = ["owner", "developer"];
        const data = await main_1.main.prisma.userAPI.findUnique({
            where: { id: userId },
        });
        if (!data || !allowedRole.includes(data.role)) {
            return res.status(403).render("error.ejs", {
                title: config_1.config.project.name + " - Access Denied",
                user: req.user,
                error: "You do not have permission to access this page",
            });
        }
        return res.render("tickets.ejs", {
            transcripts: await main_1.main.prisma.transcript.findMany(),
            tickets: await main_1.main.prisma.ticketUser.findMany(),
            title: config_1.config.project.name + " - Tickets",
            webURL: (0, functions_1.hostURL)(),
            user: req.user,
        });
    });
    app.get(formatRoute("discord/server"), auth_middleware_1.AuthPublic, auth_middleware_1.Maintenance, async (req, res) => {
        const serverId = req.query.id;
        const servers = req.user.guilds;
        if (!serverId || !servers.some((server) => server.id === serverId)) {
            return res.status(400).render("error.ejs", {
                title: config_1.config.project.name + " - Bad Request",
                user: req.user,
                error: "Server ID is required or not found in your guilds",
            });
        }
        //comprobar si el servidor el user es owner
        if (!servers.some((server) => server.id === serverId && server.owner)) {
            return res.status(403).render("error.ejs", {
                title: config_1.config.project.name + " - Access Denied",
                user: req.user,
                error: "You do not have permission to access this server",
            });
        }
        // Datos del servidor
        const data = await main_1.main.prisma.myGuild.findFirst({
            where: { guildId: serverId },
        });
        // Comandos más usados
        const commandUsage = data?.commandUsage || {};
        const topCommands = Object.entries(commandUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
        // Canales más usados
        const channelActivity = data?.channelActivity || {};
        const topChannels = Object.entries(channelActivity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));
        // Obtener nombres reales de canales usando la caché del cliente de Discord
        let channelsMap = {};
        try {
            const guild = main_1.client.guilds.cache.get(serverId);
            if (guild) {
                guild.channels.cache.forEach((ch) => {
                    if (ch.type === 0 || ch.type === "GUILD_TEXT") {
                        // type 0 = text en discord.js v14
                        channelsMap[ch.id] = ch.name;
                    }
                });
            }
        }
        catch (e) {
            // fallback: dejar ids si no hay acceso
        }
        // Estadísticas generales
        // Miembros destacados y total
        const userLevels = await main_1.main.prisma.userLevel.findMany({
            where: { guildId: serverId },
            orderBy: { level: "desc" },
            take: 10,
        });
        const totalMembers = await main_1.main.prisma.userLevel.count({ where: { guildId: serverId } });
        const totalMessages = await main_1.main.prisma.userLevel.aggregate({
            where: { guildId: serverId },
            _sum: { totalMessages: true },
        });
        // Economía
        const totalEconomy = await main_1.main.prisma.userEconomy.aggregate({
            where: { guildId: serverId },
            _sum: { balance: true },
        });
        // Niveles
        const avgLevel = await main_1.main.prisma.userLevel.aggregate({
            where: { guildId: serverId },
            _avg: { level: true },
        });
        // Datos de configuración
        const dataModLog = await main_1.main.prisma.serverModlog.findFirst({
            where: { guildId: serverId },
        });
        const dataLevelConfig = await main_1.main.prisma.levelConfig.findFirst({
            where: { guildId: serverId },
        });
        // Obtener usuarios destacados reales (si tienes acceso a Discord)
        let usersMap = {};
        try {
            const guild = main_1.client.guilds.cache.get(serverId);
            if (guild) {
                for (const u of userLevels) {
                    const member = guild.members.cache.get(u.userId);
                    if (member) {
                        usersMap[u.userId] = {
                            username: member.user.tag,
                            avatar: member.user.displayAvatarURL({ extension: "png", size: 64 }),
                        };
                    }
                }
            }
        }
        catch (e) {
            // fallback: dejar vacío
        }
        const serverData = {
            id: serverId,
            name: servers.find((server) => server.id === serverId)?.name ||
                "Unknown Server",
            icon: servers.find((server) => server.id === serverId)?.icon || null,
            levelConfig: dataLevelConfig || null,
            modLog: dataModLog || null,
            data: data || null,
        };
        return res.render("server.ejs", {
            server: servers.find((server) => server.id === serverId),
            title: config_1.config.project.name + ` - ${serverData.name}`,
            serverData: serverData,
            user: req.user,
            // Datos agregados:
            topCommands,
            topChannels,
            userLevels,
            totalMembers,
            totalMessages: totalMessages._sum.totalMessages || 0,
            totalEconomy: totalEconomy._sum.balance || 0,
            avgLevel: avgLevel._avg.level || 0,
            channelsMap,
            usersMap,
        });
    });
};
//# sourceMappingURL=view.routes.js.map
//# debugId=fb557621-a652-5ff0-b86f-bc580dcd97af
