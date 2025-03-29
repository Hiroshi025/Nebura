import { Request, Response } from "express";

import {
  isErrorResponse,
  normalizeError,
  sendErrorResponse,
  sendSuccessResponse,
} from "@/server/shared/helper-method";
import { LoginInput, RegisterInput, UpdateInput } from "@/types/utils";

import { getAuth, LoginAuth, NewAuth, UpdateAuth } from "../../../domain/services/auth.services";

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
        return sendErrorResponse(res, 400, [ERROR_MESSAGES.MISSING_DATA]);
      }

      const response = await LoginAuth({ email, password });

      if (isErrorResponse(response)) {
        return sendErrorResponse(res, 400, normalizeError(response));
      }

      return sendSuccessResponse(res, 200, {
        message: "Login successful",
        data: response,
      });
    } catch (error) {
      console.error("[AuthController] Login error:", error);
      return sendErrorResponse(res, 500, [ERROR_MESSAGES.INVALID_CREDENTIALS]);
    }
  }

  /**
   * Maneja el registro de nuevos usuarios
   */
  static async register(req: Request, res: Response) {
    try {
      const userData: RegisterInput = req.body;

      const response = await NewAuth(userData);

      if (isErrorResponse(response)) {
        return sendErrorResponse(res, 400, normalizeError(response));
      }

      return sendSuccessResponse(res, 201, {
        message: "Registration successful",
        data: response,
      });
    } catch (error) {
      console.error("[AuthController] Register error:", error);
      return sendErrorResponse(res, 500, [ERROR_MESSAGES.REGISTRATION_FAILED]);
    }
  }

  /**
   * Obtiene información del usuario
   */
  static async info(req: Request, res: Response) {
    try {
      const userId = req.params.id;

      if (!userId) {
        return sendErrorResponse(res, 400, [ERROR_MESSAGES.MISSING_USER_ID]);
      }

      const profile = await getAuth(userId);

      if (typeof profile === "string") {
        return sendErrorResponse(res, 404, [ERROR_MESSAGES.USER_NOT_FOUND]);
      }

      return sendSuccessResponse(res, 200, {
        message: "User info retrieved successfully",
        data: profile,
      });
    } catch (error) {
      console.error("[AuthController] Info error:", error);
      return sendErrorResponse(res, 500, [ERROR_MESSAGES.FETCH_FAILED]);
    }
  }

  /**
   * Actualiza la información del usuario
   */
  static async update(req: Request, res: Response) {
    try {
      const userId = req.params.id;

      if (!userId) {
        return sendErrorResponse(res, 400, [ERROR_MESSAGES.MISSING_USER_ID]);
      }

      const updateData: UpdateInput = {
        id: userId,
        ...req.body,
      };

      const response = await UpdateAuth(userId, updateData);

      if (isErrorResponse(response)) {
        return sendErrorResponse(res, 400, normalizeError(response));
      }

      return sendSuccessResponse(res, 200, {
        message: "User info updated successfully",
        data: response,
      });
    } catch (error) {
      console.error("[AuthController] Update error:", error);
      return sendErrorResponse(res, 500, [ERROR_MESSAGES.UPDATE_FAILED]);
    }
  }
}
