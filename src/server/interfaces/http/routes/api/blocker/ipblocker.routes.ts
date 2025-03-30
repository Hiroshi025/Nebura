// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { TRoutesInput } from "@/types/utils";

import { authenticateToken, isAdmin } from "../../../../../shared/middlewares/auth.middleware";
import ipBlockerControllers from "../../../controllers/blocker/ipBlocker.controllers";

// Constantes para paths base y versionado
const BASE_PATH = "/admin-block";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  app.delete(formatRoute("/unblock-ip/:ipAddress"), authenticateToken, isAdmin, ipBlockerControllers.unblockIP);
  app.get(formatRoute("/blocked-ips"), authenticateToken, isAdmin, ipBlockerControllers.listBlockedIPs);
  app.post(formatRoute("/block-ip"), authenticateToken, isAdmin, ipBlockerControllers.blockIP);
};
