import { Request, Response } from "express";

import { AuthService } from "@/server/domain/services/auth/auth.service";
import { ErrorResponse } from "@/structure/constants/user.constants";

export class AuthController {
  public service = new AuthService();
  /**
   * @desc    Login de usuario
   * @route   POST /api/auth/login
   * @access  Public
   */
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      const result = await this.service.login({ email, password });

      if ("error" in result) {
        return this.handleErrorResponse(req, res, result as ErrorResponse);
      }

      return res.status(200).json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
        message: req.t("auth.login.success"), // Mensaje de éxito desde common.json
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: req.t("errors.server_error"), // Mensaje de error desde errors.json
      });
    }
  }

  /**
   * @desc    Registro de nuevo usuario
   * @route   POST /api/auth/register
   * @access  Public
   */
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const userData = req.body;

      const result = await this.service.createAuth(userData);

      if ("error" in result) {
        return this.handleErrorResponse(req, res, result as ErrorResponse);
      }

      return res.status(201).json({
        success: true,
        data: result.user,
        message: req.t("auth.register.success"),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: req.t("errors.server_error"),
      });
    }
  }

  /**
   * @desc    Obtiene información de un usuario
   * @route   GET /api/auth/:id
   * @access  Private (solo usuarios autenticados)
   */
  async getUserProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const result = await this.service.getAuth(id);

      if ("error" in result) {
        return this.handleErrorResponse(req, res, result as ErrorResponse);
      }

      return res.status(200).json({
        success: true,
        data: result,
        message: req.t("auth.profile.success"),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: req.t("errors.server_error"),
      });
    }
  }

  /**
   * Maneja las respuestas de error de manera consistente
   */
  private handleErrorResponse(req: Request, res: Response, error: ErrorResponse): Response {
    const statusMap: Record<string, number> = {
      VALIDATION_ERROR: 400,
      USER_NOT_FOUND: 404,
      USER_EXISTS: 409,
      INVALID_CREDENTIALS: 401,
      MISSING_DATA: 400,
      ENCRYPTION_ERROR: 500,
      DATABASE_ERROR: 500,
      INTERNAL_SERVER_ERROR: 500,
    };

    const statusCode = statusMap[error.error] || 500;

    return res.status(statusCode).json({
      success: false,
      error: error.error,
      message: req.t(`errors.${error.error.toLowerCase()}`), // Mensaje de error dinámico desde errors.json
      details: error.details,
    });
  }
}
