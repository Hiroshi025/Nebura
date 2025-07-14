/**
 * @fileoverview
 * This file defines the main web view routes for the Nebura Dashboard.
 * All endpoints are prefixed with `/dashboard/` and render EJS views.
 *
 * @module view.routes
 * @see {@link https://expressjs.com/en/4x/api.html#app Express Application API}
 */

import axios from "axios";
import { Request, Response } from "express";
import fs, { statSync } from "node:fs";
import path, { join } from "node:path";

import { AuthPublic, Maintenance } from "@/interfaces/http/middlewares/web/auth.middleware";
import { client, main } from "@/main";
import { hostURL } from "@/shared/functions";
import { TRoutesInput, User } from "@/typings/utils";
import { config } from "@utils/config";
import { WinstonLogger } from "@utils/winston";

/**
 * Formats the route path with the `/dashboard/` prefix.
 * @param path - Specific endpoint path.
 * @returns The formatted route path.
 */
const formatRoute = (path: string): string => `/dashboard/${path}`;

/**
 * Registers all Nebura Dashboard web view routes.
 *
 * @param app - Express application instance.
 * @see {@link https://expressjs.com/en/4x/api.html#app Express Application API}
 */
export default ({ app }: TRoutesInput) => {
  /**
   * GET /dashboard/status
   *
   * Renders the status page, showing Nebura server and Discord status.
   *
   * @route GET /dashboard/status
   * @returns {View} status.ejs
   */
  app.get(formatRoute("status"), async (req: Request, res: Response) => {
    try {
      const [serverResponse, discordResponse] = await Promise.all([
        axios.get(`${hostURL()}/api/v1/public/status`),
        axios.get("https://discordstatus.com/api/v2/status.json"),
      ]);

      if (serverResponse.status !== 200 || discordResponse.status !== 200) {
        return res.status(500).json({
          message: "Failed to retrieve server status",
        });
      }

      return res.render("status.ejs", {
        title: config.project.name + " - Status",
        user: req.user,
        status: serverResponse.data,
        discordStatus: discordResponse.data,
      });
    } catch (error: any) {
      return res.render("error.ejs", {
        title: "Nebura",
        user: req.user,
        error: error.message || "An unexpected error occurred",
      });
    }
  });

  app.get(formatRoute("nsfw"), (req: Request, res: Response) => {
    return res.render("nsfw.ejs", {
      title: config.project.name + " - Hentai",
      user: req.user,
      cdnUrl: hostURL(),
      sharedFile: null,
    });
  });

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
  app.get(formatRoute("cdn"), AuthPublic, Maintenance, (req: Request, res: Response) => {
    return res.render("cdn.ejs", {
      title: config.project.name + " - CDN",
      user: req.user,
      cdnUrl: hostURL(),
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
  app.get(formatRoute("cdn/share"), (req: Request, res: Response) => {
    // Lee los parámetros de la URL
    const { title, url, mime, size, date, description } = req.query;

    // Si faltan datos mínimos, puedes mostrar un error o una vista genérica
    if (!title || !url || !mime) {
      return res.render("error.ejs", {
        title: config.project.name + " - Share",
        user: req.user,
      });
    }

    // Pasa los datos del archivo compartido a la vista
    res.render("cdn-share.ejs", {
      title: config.project.name + " - Share",
      user: req.user,
      sharedFile: {
        title: decodeURIComponent(title as string),
        downloadUrl: decodeURIComponent(url as string),
        mimeType: decodeURIComponent(mime as string),
        size: size ? Number(size) : 0,
        uploadedAt: date ? decodeURIComponent(date as string) : "",
        description: description ? decodeURIComponent(description as string) : "",
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
  app.get(formatRoute("logout"), (_req: Request, res: Response) => {
    return res.status(500).render("error.ejs", { title: config.project.name + " - Error" });
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
  app.get(formatRoute(""), AuthPublic, Maintenance, async (req: Request, res: Response) => {
    /*     const logger = await new WinstonLogger();
    const recentLogger = await logger.getRecentLogs(3); */
    const data = await main.prisma.userAPI.findMany();
    const userData = data.find((user) => user.discord?.userId === (req.user as User).id);

    const licenseData = await main.prisma.license.findMany({
      where: { userId: (req.user as User).id },
    });

    const fileData = await main.prisma.fileMetadata.findMany({
      where: { userId: (req.user as User).id },
    });

    const ticketData = await main.prisma.ticketUser.findMany({
      where: { userId: (req.user as User).id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // del array de datos de fileData remueve el parametro path de cada uno
    const fileDataFilter = fileData.map(({ path, ...rest }) => rest);

    return res.render("dashboard.ejs", {
      title: config.project.name + " - Dashboard",
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
  app.get(formatRoute("administrator"), AuthPublic, async (req: Request, res: Response) => {
    //la redireccion a este endpoint lo hace con '/dashboard/administrator?id=' + data.user.id;
    const userId = req.query.id as string;
    if (!userId) {
      return res.status(400).render("error.ejs", {
        title: config.project.name + " - Bad Request",
        user: req.user,
        error: "User ID is required",
      });
    }

    const allowedRole = ["owner", "developer"];
    const data = await main.prisma.userAPI.findUnique({
      where: { id: userId },
    });

    if (!data || !allowedRole.includes(data.role)) {
      return res.status(403).render("error.ejs", {
        title: config.project.name + " - Access Denied",
        user: req.user,
        error: "You do not have permission to access this page",
      });
    }

    const logger = await new WinstonLogger();
    const recentLogger = await logger.getRecentLogs(5);

    const backupsDir = path.join(__dirname, "../../../../../config/backups");
    let backupFiles: string[] = [];
    try {
      if (fs.existsSync(backupsDir) && fs.statSync(backupsDir).isDirectory()) {
        backupFiles = fs.readdirSync(backupsDir).filter((file) => file.endsWith(".json"));
      }
    } catch (e) {
      backupFiles = [];
    }

    const usersMap: { [key: string]: string } = {};
    client.users.cache.forEach((user) => {
      usersMap[user.id] = user.username; // o user.tag si quieres el tag completo
    });

    return res.render("administrator.ejs", {
      title: config.project.name + " - Administrator",
      user: req.user,
      usersMap,
      backups: backupFiles.map((file: any) => ({
        path: `./config/backups/${file}`,
        name: file,
      })),
      metrics: await main.prisma.metrics.findMany(),
      users: await main.prisma.userAPI.findMany(),
      licenses: await main.prisma.license.findMany(),
      myclientDiscord: await main.prisma.client.findMany(),
      components: await main.prisma.component.findMany(),
      categories: await main.prisma.commandCategory.findMany(),
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
  app.get(formatRoute("agent"), AuthPublic, Maintenance, (req: Request, res: Response) => {
    return res.render("agent.ejs", {
      title: config.project.name + " - Gemini",
      user: req.user,
      customer_key: process.env.CUSTOMER_SECRET as string,
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
  app.get(formatRoute("logs/view/:name"), AuthPublic, Maintenance, async (req: Request, res: Response) => {
    const userId = req.query.id as string;
    if (!userId || !/^[a-fA-F0-9]{24}$/.test(userId)) {
      return res.status(400).render("error.ejs", {
        title: config.project.name + " - Bad Request",
        user: req.user,
        error: "User ID is malformed or missing",
      });
    }

    const allowedRole = ["owner", "developer"];
    const data = await main.prisma.userAPI.findUnique({
      where: { id: userId },
    });

    if (!data || !allowedRole.includes(data.role)) {
      return res.status(403).render("error.ejs", {
        title: config.project.name + " - Access Denied",
        user: req.user,
        error: "You do not have permission to access this page",
      });
    }

    const winston = new WinstonLogger();
    const pathDir = join(winston.logDir, req.params.name);

    const response = await axios({
      url: `${hostURL()}/dashboard/utils/logs/${req.params.name}`,
      method: "GET",
    });

    if (response.status !== 200) {
      return res.status(500).render("error.ejs", {
        title: config.project.name + " - Error",
        user: req.user,
        error: "Failed to retrieve log file",
      });
    }

    const logLines = response.data;
    return res.render("logs-view.ejs", {
      logFile: pathDir,
      logLines: logLines,
      title: config.project.name + " - Logs Viewer",
      user: req.user,
      logName: req.params.name,
      logSize: await statSync(pathDir).size,
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
  app.get(formatRoute("support"), AuthPublic, Maintenance, async (req: Request, res: Response) => {
    return res.render("support.ejs", {
      title: config.project.name + " - Support",
      webURL: hostURL(),
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
  app.get(formatRoute("maintenance"), AuthPublic, Maintenance, async (req: Request, res: Response) => {
    return res.render("maintenance.ejs", {
      title: config.project.name + " - Maintenance",
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
  app.get(formatRoute("administrator/tickets"), AuthPublic, Maintenance, async (req: Request, res: Response) => {
    const userId = req.query.id as string;
    if (!userId) {
      return res.status(400).render("error.ejs", {
        title: config.project.name + " - Bad Request",
        user: req.user,
        error: "User ID is required",
      });
    }

    const allowedRole = ["owner", "developer"];
    const data = await main.prisma.userAPI.findUnique({
      where: { id: userId },
    });

    if (!data || !allowedRole.includes(data.role)) {
      return res.status(403).render("error.ejs", {
        title: config.project.name + " - Access Denied",
        user: req.user,
        error: "You do not have permission to access this page",
      });
    }

    return res.render("tickets.ejs", {
      transcripts: await main.prisma.transcript.findMany(),
      tickets: await main.prisma.ticketUser.findMany(),
      title: config.project.name + " - Tickets",
      webURL: hostURL(),
      user: req.user,
    });
  });

  app.get(formatRoute("discord/server"), AuthPublic, Maintenance, async (req: Request, res: Response) => {
    const serverId = req.query.id as string;
    const servers = (req.user as any).guilds;

    if (!serverId || !servers.some((server: { id: string }) => server.id === serverId)) {
      return res.status(400).render("error.ejs", {
        title: config.project.name + " - Bad Request",
        user: req.user,
        error: "Server ID is required or not found in your guilds",
      });
    }

    //comprobar si el servidor el user es owner
    if (!servers.some((server: { id: string; owner: boolean }) => server.id === serverId && server.owner)) {
      return res.status(403).render("error.ejs", {
        title: config.project.name + " - Access Denied",
        user: req.user,
        error: "You do not have permission to access this server",
      });
    }

    // Datos del servidor
    const data = await main.prisma.myGuild.findFirst({
      where: { guildId: serverId },
    });

    // Comandos más usados
    const commandUsage = data?.commandUsage || {};
    const topCommands = Object.entries(commandUsage)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Canales más usados
    const channelActivity = data?.channelActivity || {};
    const topChannels = Object.entries(channelActivity)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));

    // Obtener nombres reales de canales usando la caché del cliente de Discord
    let channelsMap: { [id: string]: string } = {};
    try {
      const guild = client.guilds.cache.get(serverId);
      if (guild) {
        guild.channels.cache.forEach((ch: any) => {
          if (ch.type === 0 || ch.type === "GUILD_TEXT") {
            // type 0 = text en discord.js v14
            channelsMap[ch.id] = ch.name;
          }
        });
      }
    } catch (e) {
      // fallback: dejar ids si no hay acceso
    }

    // Estadísticas generales
    // Miembros destacados y total
    const userLevels = await main.prisma.userLevel.findMany({
      where: { guildId: serverId },
      orderBy: { level: "desc" },
      take: 10,
    });
    const totalMembers = await main.prisma.userLevel.count({ where: { guildId: serverId } });
    const totalMessages = await main.prisma.userLevel.aggregate({
      where: { guildId: serverId },
      _sum: { totalMessages: true },
    });
    // Economía
    const totalEconomy = await main.prisma.userEconomy.aggregate({
      where: { guildId: serverId },
      _sum: { balance: true },
    });
    // Niveles
    const avgLevel = await main.prisma.userLevel.aggregate({
      where: { guildId: serverId },
      _avg: { level: true },
    });

    // Datos de configuración
    const dataModLog = await main.prisma.serverModlog.findFirst({
      where: { guildId: serverId },
    });
    const dataLevelConfig = await main.prisma.levelConfig.findFirst({
      where: { guildId: serverId },
    });

    // Obtener usuarios destacados reales (si tienes acceso a Discord)
    let usersMap: { [id: string]: { username: string; avatar: string } } = {};
    try {
      const guild = client.guilds.cache.get(serverId);
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
    } catch (e) {
      // fallback: dejar vacío
    }

    const serverData = {
      id: serverId,
      name: servers.find((server: { id: string }) => server.id === serverId)?.name || "Unknown Server",
      icon: servers.find((server: { id: string }) => server.id === serverId)?.icon || null,
      levelConfig: dataLevelConfig || null,
      modLog: dataModLog || null,
      data: data || null,
    };

    return res.render("server.ejs", {
      server: servers.find((server: { id: string }) => server.id === serverId),
      title: config.project.name + ` - ${serverData.name}`,
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
