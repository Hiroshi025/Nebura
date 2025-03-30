import { authenticateToken } from "@/server/shared/middlewares/token.middleware";
import { RateLimitManager } from "@/shared/rateLimitMiddlware";
import { TRoutesInput } from "@/typings/utils";

import { isAdmin } from "../../../../../shared/middlewares/auth.middleware";
import { LicenseController } from "../../../controllers/license/license.controllers";

const BASE_PATH = "/license";
const API_VERSION = "/api/v1";

const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;

export default ({ app }: TRoutesInput) => {
  const controller = new LicenseController();

  // Rutas de Administración (requieren autenticación y rol admin)
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
  app.get(
    formatRoute("/"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    authenticateToken,
    controller.getAll.bind(controller),
  );

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

  // Ruta pública para validación de licencias
  app.post(
    formatRoute("/validate/:key"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    controller.validate.bind(controller),
  );
};
