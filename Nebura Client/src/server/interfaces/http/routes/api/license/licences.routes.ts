import { authenticateToken } from "@/server/shared/middlewares/jwt/token.middleware";
import { RateLimitManager } from "@/shared/rateLimit";
import { TRoutesInput } from "@/typings/utils";

import { isAdmin } from "../../../../../shared/middlewares/jwt/auth.middleware";
import { SecurityController } from "../../../controllers/admin/devs.controllers";
import { LicenseController } from "../../../controllers/license/license.controllers";

const BASE_PATH = "/license";
const API_VERSION = "/api/v1";

const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;

export default ({ app }: TRoutesInput) => {
  const controller = new LicenseController();
  const security = new SecurityController();

  // Rutas de Administración (requieren autenticación y rol admin)

  /**
   * Endpoint para crear una nueva licencia.
   * Requiere autenticación y rol de administrador.
   */
  app.post(
    formatRoute("/"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isAdmin,
    controller.create.bind(controller),
  );

  /**
   * Endpoint para actualizar una licencia existente por su ID.
   * Requiere autenticación y rol de administrador.
   */
  app.put(
    formatRoute("/:id"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isAdmin,
    controller.update.bind(controller),
  );

  /**
   * Endpoint para eliminar una licencia existente por su ID.
   * Requiere autenticación y rol de administrador.
   */
  app.delete(
    formatRoute("/:id"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isAdmin,
    controller.delete.bind(controller),
  );

  // Rutas protegidas (solo autenticación)

  /**
   * Endpoint para obtener todas las licencias.
   * Requiere autenticación y rol de administrador.
   */
  app.get(
    formatRoute("/"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    isAdmin,
    controller.getAll.bind(controller),
  );

  /**
   * Endpoint para obtener una licencia específica por su ID.
   * Requiere autenticación.
   */
  app.get(
    formatRoute("/:id"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    controller.getById.bind(controller),
  );

  /**
   * Endpoint para obtener todas las licencias asociadas a un usuario específico.
   * Requiere autenticación.
   */
  app.get(
    formatRoute("/user/:userId"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    controller.getByUser.bind(controller),
  );

  /**
   * Endpoint público para validar una licencia mediante su clave.
   * No requiere autenticación.
   */
  app.post(
    formatRoute("/validate/:key"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    controller.validate.bind(controller),
  );

  /**
   * Obtiene información sobre una licencia específica.
   * Método: GET
   * Ruta: /api/v1/security/license-info/:licenseKey
   * Middleware: authenticateToken
   * Controlador: security.getLicenseInfo
   * Descripción: Devuelve información sobre una licencia utilizando su clave.
   */
  app.get(
    formatRoute("/info/:licenseKey"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    security.getLicenseInfo,
  );
};
