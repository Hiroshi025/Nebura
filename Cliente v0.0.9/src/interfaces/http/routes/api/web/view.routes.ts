// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import axios from "axios";
import { Request, Response } from "express";

import { AuthPublic } from "@/interfaces/http/middlewares/web/auth.middleware";
import { main } from "@/main";
import { hostURL } from "@/shared/functions";
import { TRoutesInput } from "@/typings/utils";
import { config } from "@utils/config";
import { WinstonLogger } from "@utils/winston";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `/dashboard/${path}`;
export default ({ app }: TRoutesInput) => {
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
        title: "Nebura",
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

  app.get(formatRoute("cdn"), AuthPublic, (req: Request, res: Response) => {
    return res.render("cdn.ejs", {
      title: "Nebura CDN",
      user: req.user,
      cdnUrl: hostURL(),
      sharedFile: null,
    });
  });

  app.get(formatRoute("cdn/share"), (req: Request, res: Response) => {
    // Lee los parámetros de la URL
    const { title, url, mime, size, date, description } = req.query;
    // Si faltan datos mínimos, puedes mostrar un error o una vista genérica
    if (!title || !url || !mime) {
      return res.render("error.ejs", {
        title: "Nebura",
        user: req.user,
      });
    }
    // Pasa los datos del archivo compartido a la vista
    res.render("cdn-share.ejs", {
      title: title as string,
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

  app.get(formatRoute("logout"), (_req: Request, res: Response) => {
    return res.status(500).render("error.ejs", { title: "Nebura" });
  });

  app.get(formatRoute(""), AuthPublic, async (req: Request, res: Response) => {
    /*     const logger = await new WinstonLogger();
    const recentLogger = await logger.getRecentLogs(3); */

    return res.render("dashboard.ejs", {
      title: "Nebura",
      user: req.user,
      //recentLogs: recentLogger,
    });
  });

  app.get(formatRoute("administrator"), AuthPublic, async (req: Request, res: Response) => {
    //la redireccion a este endpoint lo hace con '/dashboard/administrator?id=' + data.user.id;
    const userId = req.query.id as string;
    if (!userId) {
      return res.status(400).render("error.ejs", {
        title: "Nebura - Bad Request",
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
        title: "Nebura - Access Denied",
        user: req.user,
        error: "You do not have permission to access this page",
      });
    }

    const logger = await new WinstonLogger();
    const recentLogger = await logger.getRecentLogs(5);

    return res.render("administrator.ejs", {
      title: "Nebura",
      user: req.user,
      metrics: await main.prisma.metrics.findMany(),
      users: await main.prisma.userAPI.findMany(),
      licenses: await main.prisma.license.findMany(),
      myclientDiscord: await main.prisma.myDiscord.findMany(),
      recentLogs: recentLogger,
    });
  });

  app.get(formatRoute("agent"), AuthPublic, (req: Request, res: Response) => {
    return res.render("agent.ejs", {
      title: "Agente Gemini",
      user: req.user,
      customer_key: config.environments.default["key-secrets"].customer,
    });
  });
};
