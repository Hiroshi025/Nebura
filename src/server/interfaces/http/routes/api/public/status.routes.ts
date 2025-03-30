// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { TRoutesInput } from "@/typings/utils";

import { StatusController } from "../../../controllers/public/status.controller";

// Constantes para paths base y versionado
const BASE_PATH = "/public";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  const status = new StatusController();

  app.get(formatRoute("/status"), status.getStatus);
};
