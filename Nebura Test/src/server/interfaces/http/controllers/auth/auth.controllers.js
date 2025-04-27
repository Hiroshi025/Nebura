"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../../../../../server/domain/services/auth/auth.service");
class AuthController {
    service = new auth_service_1.AuthService();
    /**
     * @desc    Login de usuario
     * @route   POST /api/auth/login
     * @access  Public
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await this.service.login({ email, password });
            if ("error" in result) {
                return this.handleErrorResponse(req, res, result);
            }
            return res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    user: result.user,
                },
                message: req.t("auth.login.success"), // Mensaje de éxito desde common.json
            });
        }
        catch (error) {
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
    async register(req, res) {
        try {
            const userData = req.body;
            const result = await this.service.createAuth(userData);
            if ("error" in result) {
                return this.handleErrorResponse(req, res, result);
            }
            return res.status(201).json({
                success: true,
                data: result.user,
                message: req.t("auth.register.success"),
            });
        }
        catch (error) {
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
    async getUserProfile(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.getAuth(id);
            if ("error" in result) {
                return this.handleErrorResponse(req, res, result);
            }
            return res.status(200).json({
                success: true,
                data: result,
                message: req.t("auth.profile.success"),
            });
        }
        catch (error) {
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
    handleErrorResponse(req, res, error) {
        const statusMap = {
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
exports.AuthController = AuthController;
