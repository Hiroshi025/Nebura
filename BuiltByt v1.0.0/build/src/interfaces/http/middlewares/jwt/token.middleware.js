"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="a1897dd7-6fe3-506c-a68d-9fd7ea1b3e0e")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.isCustomerToken = exports.isAdminToken = exports.authenticateToken = void 0;
const functions_1 = require("../../../../shared/functions");
const token_1 = require("../../../../shared/utils/token");
const ERROR_MESSAGES = {
    TOKEN_NOT_FOUND: "Authorization token not found in headers",
    INVALID_TOKEN: "Invalid or expired authentication token",
    SERVER_ERROR: "Authentication service unavailable",
};
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader?.split(" ")[1]; // Bearer <token>
        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    message: ERROR_MESSAGES.TOKEN_NOT_FOUND,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        const user = await (0, token_1.getToken)(token);
        if (!user) {
            return res.status(403).json({
                success: false,
                error: {
                    message: ERROR_MESSAGES.INVALID_TOKEN,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        req.user = user;
        next();
        return;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error(`[Auth Middleware Error]: ${errorMessage}`);
        res.status(500).json({
            success: false,
            error: {
                message: ERROR_MESSAGES.SERVER_ERROR,
                details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
                timestamp: new Date().toISOString(),
                //requestId: req.id Asumiendo que tienes un request ID
            },
        });
    }
    return;
};
exports.authenticateToken = authenticateToken;
const isAdminToken = (req, res, next) => {
    try {
        const secretAdmin = process.env.ADMIN_SECRET;
        const FORBIDDEN_ERROR = {
            message: "Forbidden: Insufficient privileges",
            timestamp: new Date().toISOString(),
            code: "FORBIDDEN",
        };
        // Check for admin secret header
        const headerSecret = Array.isArray(req.headers["x-secret-admin"])
            ? req.headers["x-secret-admin"][0]
            : req.headers["x-secret-admin"];
        if (!headerSecret) {
            return res.status(403).json({
                success: false,
                error: FORBIDDEN_ERROR,
            });
        }
        // Secure comparison to prevent timing attacks
        if (!(0, functions_1.safeCompare)(headerSecret, secretAdmin)) {
            return res.status(403).json({
                success: false,
                error: FORBIDDEN_ERROR,
            });
        }
        // If all checks pass, proceed
        next();
        return;
    }
    catch (error) {
        console.error("Admin check error:", error);
        return res.status(500).json({
            success: false,
            error: {
                message: "Internal server error during authorization check",
                timestamp: new Date().toISOString(),
                code: "INTERNAL_SERVER_ERROR",
            },
        });
    }
};
exports.isAdminToken = isAdminToken;
const isCustomerToken = (req, res, next) => {
    try {
        const secretCustomer = process.env.CUSTOMER_SECRET;
        const FORBIDDEN_ERROR = {
            message: "Forbidden: Insufficient privileges",
            timestamp: new Date().toISOString(),
            code: "FORBIDDEN",
        };
        const headerSecret = Array.isArray(req.headers["x-secret-customer"])
            ? req.headers["x-secret-customer"][0]
            : req.headers["x-secret-customer"];
        if (!headerSecret) {
            return res.status(403).json({
                success: false,
                error: FORBIDDEN_ERROR,
            });
        }
        // Secure comparison to prevent timing attacks
        if (!(0, functions_1.safeCompare)(headerSecret, secretCustomer)) {
            return res.status(403).json({
                success: false,
                error: FORBIDDEN_ERROR,
            });
        }
        // If all checks pass, proceed
        next();
        return;
    }
    catch (error) {
        console.error("Customer check error:", error);
        return res.status(500).json({
            success: false,
            error: {
                message: "Internal server error during authorization check",
                timestamp: new Date().toISOString(),
                code: "INTERNAL_SERVER_ERROR",
            },
        });
    }
};
exports.isCustomerToken = isCustomerToken;
//# sourceMappingURL=token.middleware.js.map
//# debugId=a1897dd7-6fe3-506c-a68d-9fd7ea1b3e0e
