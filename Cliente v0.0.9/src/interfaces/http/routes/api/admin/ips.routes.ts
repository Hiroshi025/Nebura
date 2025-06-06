// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { authenticateToken } from "@/interfaces/http/middlewares/jwt/token.middleware";
import { RateLimitManager } from "@/shared/class/rateLimit";
import { TRoutesInput } from "@/typings/utils";

import ipBlockerControllers from "../../../controllers/admin/ip.controllers";
import { isAdmin } from "../../../middlewares/jwt/auth.middleware";

// Constantes para paths base y versionado
const BASE_PATH = "/admin";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  /**
   * Desbloquea una dirección IP específica.
   * Método: DELETE
   * Ruta: /api/v1/admin/unblock-ip/:ipAddress
   * Middleware: authenticateToken, isAdmin
   * Controlador: ipBlockerControllers.unblockIP
   * Descripción: Permite a un administrador eliminar el bloqueo de una dirección IP específica.
   */
  app.delete(
    formatRoute("/unblock-ip/:ipAddress"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isAdmin,
    ipBlockerControllers.unblockIP,
  );

  /**
   * Lista todas las direcciones IP bloqueadas.
   * Método: GET
   * Ruta: /api/v1/admin/blocked-ips
   * Middleware: authenticateToken, isAdmin
   * Controlador: ipBlockerControllers.listBlockedIPs
   * Descripción: Devuelve una lista de todas las direcciones IP que están actualmente bloqueadas.
   */
  app.get(
    formatRoute("/blocked-ips"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isAdmin,
    ipBlockerControllers.listBlockedIPs,
  );

  /**
   * Bloquea una dirección IP específica.
   * Método: POST
   * Ruta: /api/v1/admin/block-ip
   * Middleware: authenticateToken, isAdmin
   * Controlador: ipBlockerControllers.blockIP
   * Descripción: Permite a un administrador bloquear una dirección IP específica.
   */
  app.post(
    formatRoute("/block-ip"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isAdmin,
    ipBlockerControllers.blockIP,
  );
};
