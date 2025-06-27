// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { Request, Response } from "express";

import { passport } from "@/adapters/external/passport";
import { TRoutesInput } from "@/typings/utils";
import { config } from "@utils/config";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `/dashboard/auth/${path}`;
export default ({ app }: TRoutesInput) => {
  app.get(
    formatRoute("discord"),
    passport.authenticate("discord", {
      failureRedirect: "/dashboard/logout",
    }),
    (_req: Request, res: Response) => {
      res.redirect("/dashboard");
    },
  );

  app.get(formatRoute(""), (req: Request, res: Response) => {
    return res.render("authme.ejs", {
      title: config.project.name + " - Nebura",
      user: req.user,
    });
  });

    app.get(formatRoute("administrator"), async (req: Request, res: Response) => {
      return res.render("authme-admin.ejs", {
        title: config.project.name + " - Nebura",
        user: req.user,
      });
    });
};
