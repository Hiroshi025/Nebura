import { TRoutesInput } from "@/types/utils";

import { authenticateToken, isAdmin } from "../../../../../shared/middlewares/auth.middleware";
import { LicenseController } from "../../../controllers/license/license.controllers";

const BASE_PATH = "/licences";
const API_VERSION = "/api/v1";

const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;

export default ({ app }: TRoutesInput) => {
  const controller = new LicenseController();

  // Rutas de Administración (requieren autenticación y rol admin)
  app.post(
    formatRoute("/"),
    authenticateToken,
    isAdmin,
    controller.create.bind(controller)
  );

  app.put(
    formatRoute("/:id"),
    authenticateToken,
    isAdmin,
    controller.update.bind(controller)
  );

  app.delete(
    formatRoute("/:id"),
    authenticateToken,
    isAdmin,
    controller.delete.bind(controller)
  );

  // Rutas protegidas (solo autenticación)
  app.get(
    formatRoute("/"),
    authenticateToken,
    controller.getAll.bind(controller)
  );

  app.get(
    formatRoute("/:id"),
    authenticateToken,
    controller.getById.bind(controller)
  );

  app.get(
    formatRoute("/user/:userId"),
    authenticateToken,
    controller.getByUser.bind(controller)
  );

  // Ruta pública para validación de licencias
  app.post(
    formatRoute("/validate/:key"),
    controller.validate.bind(controller)
  );
};