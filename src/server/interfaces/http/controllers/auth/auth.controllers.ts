import { Request, Response } from "express";

import { ErrorResponse } from "@/infra/constants/user.constants";
import { AuthService } from "@/server/domain/services/auth/auth.service";

export class AuthController {
  private service = new AuthService();
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
        return this.handleErrorResponse(res, result as ErrorResponse);
      }

      return res.status(200).json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      console.error("AuthController.login error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
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
        return this.handleErrorResponse(res, result as ErrorResponse);
      }

      return res.status(201).json({
        success: true,
        data: result.user,
      });
    } catch (error) {
      console.error("AuthController.register error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
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
        return this.handleErrorResponse(res, result as ErrorResponse);
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("AuthController.getUserProfile error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  }

  /**
   * Maneja las respuestas de error de manera consistente
   */
  private handleErrorResponse(res: Response, error: ErrorResponse): Response {
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
      message: error.message,
      details: error.details,
    });
  }
}
