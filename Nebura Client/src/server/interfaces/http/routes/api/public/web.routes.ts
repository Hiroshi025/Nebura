// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import axios from "axios";
import { Request, Response } from "express";

import { hostURL } from "@/shared/functions";
import { TRoutesInput } from "@/typings/utils";

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
        axios.get("https://discordstatus.com/api/v2/status.json")
      ]);

      if (serverResponse.status !== 200 || discordResponse.status !== 200) {
        return res.status(500).json({
          message: "Failed to retrieve server status"
        });
      }

      return res.render("status.ejs", {
        title: "Nebura Client",
        user: req.user,
        status: serverResponse.data,
        discordStatus: discordResponse.data
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Error processing requests",
        error: error.message
      });
    }
  });
};
