"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="c355c8e2-2436-5690-8dcf-81903582739d")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.isCustomer = exports.isAdmin = exports.isDevelopment = void 0;
const main_1 = require("../../../../main");
const isDevelopment = async (req, res, next) => {
    try {
        const data = await main_1.main.prisma.userAPI.findUnique({ where: { id: req.user.id } });
        if (!data) {
            return res.status(401).json({
                success: false,
                error: {
                    message: "Unauthorized: Authentication required",
                    timestamp: new Date().toISOString(),
                    code: "UNAUTHORIZED",
                },
            });
        }
        const isDev = data.role === "developer" || data.role === "owner";
        if (!isDev) {
            return res.status(403).json({
                success: false,
                error: {
                    message: "Forbidden: Insufficient privileges",
                    timestamp: new Date().toISOString(),
                    code: "FORBIDDEN",
                },
            });
        }
        next();
        return;
    }
    catch (error) {
        console.error("Development check error:", error);
        return res.status(500).json({
            success: false,
            error: {
                message: "Internal server error during development check",
                timestamp: new Date().toISOString(),
                code: "INTERNAL_SERVER_ERROR",
            },
        });
    }
};
exports.isDevelopment = isDevelopment;
const isAdmin = async (req, res, next) => {
    try {
        const data = await main_1.main.prisma.userAPI.findUnique({ where: { id: req.user.id } });
        if (!data) {
            return res.status(401).json({
                success: false,
                error: {
                    message: "Unauthorized: Authentication required",
                    timestamp: new Date().toISOString(),
                    code: "UNAUTHORIZED",
                },
            });
        }
        const isAdmin = data.role === "admin" || data.role === "owner";
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                error: {
                    message: "Forbidden: Insufficient privileges",
                    timestamp: new Date().toISOString(),
                    code: "FORBIDDEN",
                },
            });
        }
        next();
        return;
        return;
    }
    catch (error) {
        console.error("Admin check error:", error);
        return res.status(500).json({
            success: false,
            error: {
                message: "Internal server error during admin check",
                timestamp: new Date().toISOString(),
                code: "INTERNAL_SERVER_ERROR",
            },
        });
    }
};
exports.isAdmin = isAdmin;
const isCustomer = async (req, res, next) => {
    try {
        const data = await main_1.main.prisma.userAPI.findUnique({ where: { id: req.user.id } });
        if (!data) {
            return res.status(401).json({
                success: false,
                error: {
                    message: "Unauthorized: Authentication required",
                    timestamp: new Date().toISOString(),
                    code: "UNAUTHORIZED",
                },
            });
        }
        const isCustomer = data.role === "customer" || data.role === "owner";
        if (!isCustomer) {
            return res.status(403).json({
                success: false,
                error: {
                    message: "Forbidden: Insufficient privileges",
                    timestamp: new Date().toISOString(),
                    code: "FORBIDDEN",
                },
            });
        }
        next();
        return;
    }
    catch (error) {
        console.error("Customer check error:", error);
        return res.status(500).json({
            success: false,
            error: {
                message: "Internal server error during customer check",
                timestamp: new Date().toISOString(),
                code: "INTERNAL_SERVER_ERROR",
            },
        });
    }
};
exports.isCustomer = isCustomer;
//# sourceMappingURL=auth.middleware.js.map
//# debugId=c355c8e2-2436-5690-8dcf-81903582739d
