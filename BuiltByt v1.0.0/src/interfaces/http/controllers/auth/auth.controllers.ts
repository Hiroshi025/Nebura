import { Request, Response } from "express";

import { ErrorResponse } from "@/adapters/validators/user";
import { AuthService } from "@/application/services/auth/auth.service";

/**
 * Controller for handling authentication-related HTTP requests.
 *
 * Provides endpoints for user login, registration, and profile retrieval.
 * Utilizes the AuthService for business logic and ensures consistent error handling.
 *
 * @example
 * const controller = new AuthController();
 * app.post('/api/auth/login', controller.login);
 * app.post('/api/auth/register', controller.register);
 * app.get('/api/auth/:id', controller.getUserProfile);
 */
export class AuthController extends AuthService {
  constructor() {
    super();
  }

  /**
   * Handles user login requests.
   *
   * @route POST /api/auth/login
   * @access Public
   * @param req - Express Request object containing user credentials in the body.
   * @param res - Express Response object.
   * @returns {Promise<Response>} A promise resolving to the HTTP response.
   *
   * @example
   * // Request body:
   * // { "email": "user@example.com", "password": "secret" }
   * // Response:
   * // { success: true, data: { token: "...", user: {...} }, message: "Login successful" }
   */
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      const result = await this.loginAuth({ email, password });

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
   * Handles new user registration requests.
   *
   * @route POST /api/auth/register
   * @access Public
   * @param req - Express Request object containing user registration data in the body.
   * @param res - Express Response object.
   * @returns {Promise<Response>} A promise resolving to the HTTP response.
   *
   * @example
   * // Request body:
   * // { "email": "user@example.com", "password": "secret", ... }
   * // Response:
   * // { success: true, data: {...}, message: "Registration successful" }
   */
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const userData = req.body;

      const result = await this.createAuth(userData);

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
   * Retrieves profile information for a specific user.
   *
   * @route GET /api/auth/:id
   * @access Private (authenticated users only)
   * @param req - Express Request object with user ID in params.
   * @param res - Express Response object.
   * @returns {Promise<Response>} A promise resolving to the HTTP response.
   *
   * @example
   * // GET /api/auth/123
   * // Response:
   * // { success: true, data: {...}, message: "Profile retrieved successfully" }
   */
  async getUserProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const result = await this.getAuth(id);

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
   * Handles error responses in a consistent format.
   *
   * Maps error codes to HTTP status codes and returns a standardized error response.
   *
   * @param req - Express Request object.
   * @param res - Express Response object.
   * @param error - ErrorResponse object containing error details.
   * @returns {Response} The HTTP response with error details.
   *
   * @example
   * // Returns:
   * // { success: false, error: "USER_NOT_FOUND", message: "...", details: {...} }
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
