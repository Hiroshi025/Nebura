// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { TRoutesInput } from "@/types/utils";

import { authenticateToken } from "../../../../shared/middlewares/auth.middleware";
import { AuthApiController } from "../../controllers/auth.controllers";

// Constantes para paths base y versionado
const BASE_PATH = "/auth";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  // Agrupar rutas relacionadas
  app.post(formatRoute("/register"), AuthApiController.register);
  app.post(formatRoute("/login"), AuthApiController.login);

  // Rutas protegidas (requieren autenticación)
  app.put(formatRoute("/update/:id"), authenticateToken, AuthApiController.update);
  app.get(formatRoute("/:id"), authenticateToken, AuthApiController.info);
};
