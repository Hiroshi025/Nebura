// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { TRoutesInput } from "@/types/utils";

import { authenticateToken, isDevelopment } from "../../../../shared/middlewares/auth.middleware";
import { UserController } from "../../controllers/user.controllers";

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
  // Rutas para Administracion
  app.post(
    formatRoute("/update-role/:id"),
    authenticateToken,
    isDevelopment,
    UserController.changeRole,
  );
};
