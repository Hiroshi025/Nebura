import { Request, Response } from "express";
import { ZodIssue } from "zod";

import { getAuth, LoginAuth, NewAuth, UpdateAuth } from "../../../domain/services/auth.services";

// Tipos e interfaces
type ErrorResponse = {
  errors: ZodIssue[] | string[] | string;
  data: null;
};

// Constantes para mensajes de error
const ERROR_MESSAGES = {
  MISSING_USER_ID: "Missing user id",
  MISSING_DATA: "Missing required fields",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_FOUND: "User not found",
  REGISTRATION_FAILED: "Registration failed",
  UPDATE_FAILED: "Update failed",
  FETCH_FAILED: "Failed to fetch user info",
};

export class AuthApiController {
  /**
   * Maneja el inicio de sesión de usuarios
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password }: LoginInput = req.body;

      if (!email || !password) {
        return this.sendErrorResponse(res, 400, [ERROR_MESSAGES.MISSING_DATA]);
      }

      const response = await LoginAuth({ email, password });

      if (this.isErrorResponse(response)) {
        return this.sendErrorResponse(res, 400, this.normalizeError(response));
      }

      return this.sendSuccessResponse(res, 200, response);
    } catch (error) {
      console.error("[AuthController] Login error:", error);
      return this.sendErrorResponse(res, 500, [ERROR_MESSAGES.INVALID_CREDENTIALS]);
    }
  }

  /**
   * Maneja el registro de nuevos usuarios
   */
  static async register(req: Request, res: Response) {
    try {
      const userData: RegisterInput = req.body;

      const response = await NewAuth(userData);

      if (this.isErrorResponse(response)) {
        return this.sendErrorResponse(res, 400, this.normalizeError(response));
      }

      return this.sendSuccessResponse(res, 201, response);
    } catch (error) {
      console.error("[AuthController] Register error:", error);
      return this.sendErrorResponse(res, 500, [ERROR_MESSAGES.REGISTRATION_FAILED]);
    }
  }

  /**
   * Obtiene información del usuario
   */
  static async info(req: Request, res: Response) {
    try {
      const userId = req.params.id;

      if (!userId) {
        return this.sendErrorResponse(res, 400, [ERROR_MESSAGES.MISSING_USER_ID]);
      }

      const profile = await getAuth(userId);

      if (typeof profile === "string") {
        return this.sendErrorResponse(res, 404, [ERROR_MESSAGES.USER_NOT_FOUND]);
      }

      return this.sendSuccessResponse(res, 200, profile);
    } catch (error) {
      console.error("[AuthController] Info error:", error);
      return this.sendErrorResponse(res, 500, [ERROR_MESSAGES.FETCH_FAILED]);
    }
  }

  /**
   * Actualiza la información del usuario
   */
  static async update(req: Request, res: Response) {
    try {
      const userId = req.params.id;

      if (!userId) {
        return this.sendErrorResponse(res, 400, [ERROR_MESSAGES.MISSING_USER_ID]);
      }

      const updateData: UpdateInput = {
        id: userId,
        ...req.body,
      };

      const response = await UpdateAuth(userId, updateData);

      if (this.isErrorResponse(response)) {
        return this.sendErrorResponse(res, 400, this.normalizeError(response));
      }

      return this.sendSuccessResponse(res, 200, response);
    } catch (error) {
      console.error("[AuthController] Update error:", error);
      return this.sendErrorResponse(res, 500, [ERROR_MESSAGES.UPDATE_FAILED]);
    }
  }

  // Métodos helper
  private static isErrorResponse(response: any): response is ErrorResponse {
    return (response as ErrorResponse).errors !== undefined || typeof response === "string";
  }

  private static normalizeError(error: unknown): string[] {
    if (typeof error === "string") return [error];

    if (Array.isArray(error)) {
      return error.map((e) => (typeof e === "string" ? e : e.message));
    }

    if (typeof error === "object" && error !== null && "errors" in error) {
      const errObj = error as { errors: unknown };
      if (typeof errObj.errors === "string") return [errObj.errors];
      if (Array.isArray(errObj.errors)) {
        return errObj.errors.map((e) => (typeof e === "string" ? e : e.message));
      }
    }

    return ["Unknown error occurred"];
  }

  private static sendErrorResponse(res: Response, status: number, errors: string[]) {
    return res.status(status).json({
      errors,
      data: null,
    });
  }

  private static sendSuccessResponse<T>(res: Response, status: number, data: T) {
    return res.status(status).json({
      data,
      errors: [],
    });
  }
}
