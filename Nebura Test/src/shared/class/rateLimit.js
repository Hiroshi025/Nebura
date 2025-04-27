"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitManager = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const main_1 = require("../../main");
const config_1 = require("../utils/config");
const console_1 = require("../utils/functions/console");
const ipBlocker_1 = require("./ipBlocker");
const notification_1 = require("./notification");
const ipBlocker = ipBlocker_1.IPBlocker.getInstance();
const notification = new notification_1.Notification();
/**
 * Manages rate limiting for the application, including default and custom configurations.
 * Also handles IP blocking for repeated violations.
 */
class RateLimitManager {
    notifications;
    static instance;
    defaultLimiter;
    /**
     * Private constructor to enforce singleton pattern.
     */
    constructor() {
        this.notifications = config_1.config.moderation.notifications;
        // Default rate limiter configuration
        this.defaultLimiter = (0, express_rate_limit_1.rateLimit)({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
            legacyHeaders: false, // Disable the `X-RateLimit-*` headers
            handler: async (req, res) => {
                const ip = req.ip || req.socket.remoteAddress;
                if (ip) {
                    await this.recordRateLimitViolation(ip, req.path);
                    const violationCount = await this.getViolationCount(ip);
                    if (violationCount >= 3) {
                        await ipBlocker.blockIP(ip, "system", `Automatic block due to ${violationCount} rate limit violations`, new Date(Date.now() + 24 * 60 * 60 * 1000));
                    }
                }
                res.status(429).json({
                    success: false,
                    error: "Too many requests",
                    message: "You have exceeded the allowed request limit",
                });
            },
        });
    }
    /**
     * Retrieves the singleton instance of the RateLimitManager.
     * @returns {RateLimitManager} The singleton instance.
     */
    static getInstance() {
        if (!RateLimitManager.instance) {
            RateLimitManager.instance = new RateLimitManager();
        }
        return RateLimitManager.instance;
    }
    /**
     * Gets the default rate limiter middleware.
     * @returns {any} The default rate limiter middleware.
     */
    getDefaultLimiter() {
        return this.defaultLimiter;
    }
    /**
     * Creates a custom rate limiter with specific options.
     * @param {any} options - Configuration options for the custom rate limiter.
     * @returns {any} The custom rate limiter middleware.
     */
    createCustomLimiter(options) {
        return (0, express_rate_limit_1.rateLimit)({
            ...options,
            handler: async (req, res) => {
                const ip = req.ip || req.socket.remoteAddress;
                if (ip) {
                    await this.recordRateLimitViolation(ip, req.path);
                }
                res.status(429).json({
                    success: false,
                    error: "Too many requests",
                    message: options.message || "You have exceeded the custom request limit",
                });
            },
        });
    }
    /**
     * Records a rate limit violation in the database.
     * @param {string} ip - The IP address of the violator.
     * @param {string} endpoint - The endpoint where the violation occurred.
     * @returns {Promise<void>} A promise that resolves when the violation is recorded.
     */
    async recordRateLimitViolation(ip, endpoint) {
        try {
            await main_1.main.prisma.rateLimitViolation.create({
                data: {
                    ipAddress: ip,
                    endpoint,
                    violationTime: new Date(),
                },
            });
            // Send notification if the webhook token is valid
            if (this.notifications.webhooks.token) {
                await notification.sendWebhookNotification("Rate Limit Violation", `IP: ${ip} has exceeded the request limit on endpoint: ${endpoint}`, "#FF0000", [
                    { name: "IP Address", value: ip, inline: true },
                    { name: "Endpoint", value: endpoint, inline: true },
                    { name: "Time", value: new Date().toISOString(), inline: true },
                ], {
                    content: "🚨 Rate Limit Violation Alert",
                    username: "Rate Limit Manager",
                });
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", "Error recording rate limit violation:");
        }
    }
    /**
     * Retrieves the count of rate limit violations for a specific IP in the last 24 hours.
     * @param {string} ip - The IP address to check.
     * @returns {Promise<number>} The count of violations.
     */
    async getViolationCount(ip) {
        try {
            const count = await main_1.main.prisma.rateLimitViolation.count({
                where: {
                    ipAddress: ip,
                    violationTime: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                    },
                },
            });
            // Send notification if the webhook token is valid and the count is critical
            if (this.notifications.webhooks.token && count >= 3) {
                await notification.sendWebhookNotification("Critical Rate Limit Violations", `IP: ${ip} has reached ${count} violations in the last 24 hours.`, "#FFA500", [
                    { name: "IP Address", value: ip, inline: true },
                    { name: "Violation Count", value: count.toString(), inline: true },
                    { name: "Time", value: new Date().toISOString(), inline: true },
                ], {
                    content: "⚠️ Critical Rate Limit Violations Alert",
                    username: "Rate Limit Manager",
                });
            }
            return count;
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", "Error getting rate limit violation count:");
            return 0;
        }
    }
    /**
     * Middleware to apply rate limiting based on license type or default settings.
     * Also checks if the IP is blocked.
     * @param {Request} req - The Express request object.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The next middleware function.
     */
    async getRateLimitMiddleware(req, res, next) {
        try {
            // Check if IP is blocked first
            const ip = req.ip || req.socket.remoteAddress;
            if (ip && ipBlocker.isIPBlocked(ip)) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied",
                    message: "Your IP address has been blocked",
                });
            }
            if (req.license) {
                switch (req.license.type) {
                    case "FREE":
                        return this.createCustomLimiter({
                            windowMs: 15 * 60 * 1000,
                            max: 50,
                            message: "Free tier limit exceeded (50 requests per 15 minutes)",
                        })(req, res, next);
                    case "BASIC":
                        return this.createCustomLimiter({
                            windowMs: 15 * 60 * 1000,
                            max: 200,
                            message: "Basic tier limit exceeded (200 requests per 15 minutes)",
                        })(req, res, next);
                    case "PREMIUM":
                        return this.createCustomLimiter({
                            windowMs: 15 * 60 * 1000,
                            max: 1000,
                            message: "Premium tier limit exceeded (1000 requests per 15 minutes)",
                        })(req, res, next);
                    default:
                        return this.defaultLimiter(req, res, next);
                }
            }
            return this.defaultLimiter(req, res, next);
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", "Error in rate limit middleware:");
            next(error);
        }
    }
}
exports.RateLimitManager = RateLimitManager;
