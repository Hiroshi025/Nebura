// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { authenticateToken } from "@/server/shared/middlewares/jwt/token.middleware";
import { TRoutesInput } from "@/typings/utils";

import { SecurityController } from "../../../controllers/blocker/security.controllers";

// Constantes para paths base y versionado
const BASE_PATH = "/security";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  const security = new SecurityController();
  app.get(formatRoute("/ip-info/:ipAddress"), authenticateToken, security.getIpInfo);
  app.get(formatRoute("/license-info/:licenseKey"), authenticateToken, security.getLicenseInfo);
};
