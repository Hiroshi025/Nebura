"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPBlocker = void 0;
const chalk_1 = __importDefault(require("chalk"));
const main_1 = require("../../main");
const console_1 = require("../../shared/utils/functions/console");
const emojis_json_1 = __importDefault(require("../../../config/json/emojis.json"));
const config_1 = require("../utils/config");
const notification_1 = require("./notification");
/**
 * Class to manage IP address blocking.
 */
class IPBlocker {
    static instance;
    notifications;
    blockedIPs = new Set();
    lastUpdate = new Date(0);
    /**
     * Private constructor to implement the Singleton pattern.
     */
    constructor() {
        this.notifications = config_1.config.moderation.notifications;
        this.loadBlockedIPs();
        // Update every hour
        setInterval(() => this.loadBlockedIPs(), 60 * 60 * 1000);
        // Auto-unblock expired IPs every 10 minutes
        setInterval(() => this.autoUnblockExpiredIPs(), 10 * 60 * 1000);
    }
    /**
     * Gets the unique instance of IPBlocker.
     * @returns The IPBlocker instance.
     */
    static getInstance() {
        if (!IPBlocker.instance) {
            IPBlocker.instance = new IPBlocker();
        }
        return IPBlocker.instance;
    }
    /**
     * Loads blocked IP addresses from the database.
     * @returns A promise that resolves when the IPs are loaded.
     */
    async loadBlockedIPs() {
        try {
            (0, console_1.logWithLabel)("IPBlocker", "Loading blocked IPs...");
            const now = new Date();
            const activeBlocks = await main_1.main.prisma.blockedIP.findMany({
                where: {
                    isActive: true,
                    OR: [{ expiresAt: { gt: now } }, { expiresAt: undefined }],
                },
            });
            this.blockedIPs = new Set(activeBlocks.map((block) => block.ipAddress));
            this.lastUpdate = new Date();
            (0, console_1.logWithLabel)("IPBlocker", [
                `${this.blockedIPs.size} Ips is blocked and loaded in memory.`,
                `  ${chalk_1.default.grey(`${emojis_json_1.default.moderator}   Last update: ${this.lastUpdate.toISOString()}`)}`,
            ].join("\n"));
        }
        catch (error) {
            (0, console_1.logWithLabel)("IPBlocker", `Error loading blocked IPs: ${error}`, "error");
            throw error;
        }
    }
    /**
     * Automatically unblocks IPs whose block duration has expired.
     */
    async autoUnblockExpiredIPs() {
        try {
            const now = new Date();
            const expiredBlocks = await main_1.main.prisma.blockedIP.findMany({
                where: {
                    isActive: true,
                    expiresAt: { lte: now },
                },
            });
            for (const block of expiredBlocks) {
                await this.unblockIP(block.ipAddress);
            }
            if (expiredBlocks.length > 0) {
                (0, console_1.logWithLabel)("IPBlocker", `${expiredBlocks.length} expired IP blocks have been automatically unblocked.`);
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("IPBlocker", `Error during auto-unblock of expired IPs: ${error}`, "error");
        }
    }
    /**
     * Blocks an IP address.
     * @param ipAddress - The IP address to block.
     * @param userId - The ID of the user performing the block.
     * @param reason - The reason for the block (optional).
     * @param expiresAt - The expiration date of the block (optional).
     * @returns A promise that resolves when the IP is blocked.
     */
    async blockIP(ipAddress, userId, reason, expiresAt) {
        try {
            await main_1.main.prisma.blockedIP.upsert({
                where: { ipAddress },
                update: {
                    reason,
                    blockedBy: userId,
                    expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
                    isActive: true,
                },
                create: {
                    ipAddress,
                    reason,
                    blockedBy: userId,
                    expiresAt: expiresAt ? expiresAt.toISOString() : null,
                    isActive: true,
                },
            });
            this.blockedIPs.add(ipAddress);
            (0, console_1.logWithLabel)("api", `[IPBlocker] IP ${ipAddress} blocked by ${userId}. Reason: ${reason || "Not specified"}`);
            // Send notification if webhook token is valid
            if (this.notifications.webhooks.token) {
                const notification = new notification_1.Notification();
                await notification.sendWebhookNotification("IP Blocked", `The IP address ${ipAddress} has been blocked.`, "#FF0000", [
                    { name: "Blocked By", value: userId, inline: true },
                    { name: "Reason", value: reason || "Not specified", inline: true },
                    { name: "Expires At", value: expiresAt?.toISOString() || "Indefinite", inline: true },
                ]);
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("api", `[IPBlocker] Error blocking IP ${ipAddress}: ${error}`);
            throw error;
        }
    }
    /**
     * Unblocks an IP address.
     * @param ipAddress - The IP address to unblock.
     * @returns A promise that resolves when the IP is unblocked.
     */
    async unblockIP(ipAddress) {
        try {
            await main_1.main.prisma.blockedIP.updateMany({
                where: { ipAddress },
                data: { isActive: false },
            });
            this.blockedIPs.delete(ipAddress);
            (0, console_1.logWithLabel)("api", `[IPBlocker] IP ${ipAddress} unblocked.`);
            // Send notification if webhook token is valid
            if (this.notifications.webhooks.token) {
                const notification = new notification_1.Notification();
                await notification.sendWebhookNotification("IP Unblocked", `The IP address ${ipAddress} has been unblocked.`, "#00FF00", [{ name: "IP Address", value: ipAddress, inline: true }]);
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("api", `[IPBlocker] Error unblocking IP ${ipAddress}: ${error}`);
            throw error;
        }
    }
    /**
     * Checks if an IP address is blocked.
     * @param ipAddress - The IP address to check.
     * @returns `true` if the IP is blocked, otherwise `false`.
     */
    isIPBlocked(ipAddress) {
        return this.blockedIPs.has(ipAddress);
    }
    /**
     * Gets the middleware to block requests from blocked IPs.
     * @returns Express middleware.
     */
    getMiddleware() {
        return (req, res, next) => {
            const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
            if (typeof clientIp !== "string") {
                return res.status(400).json({ error: "Could not determine IP address" });
            }
            // Extract the real IP if behind a proxy
            const realIp = clientIp.split(",")[0].trim();
            if (this.isIPBlocked(realIp)) {
                (0, console_1.logWithLabel)("api", `[IPBlocker] IP ${realIp} blocked. Access denied.`);
                return res.status(403).json({
                    error: "Access denied",
                    reason: "Your IP address has been blocked",
                });
            }
            next();
            return;
        };
    }
    /**
     * Retrieves a paginated list of blocked IP addresses.
     * @param page - Page number (default is 1).
     * @param limit - Number of results per page (default is 20).
     * @returns A promise that resolves with the list of blocked IPs.
     */
    async getBlockedIPs(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return await main_1.main.prisma.blockedIP.findMany({
            where: { isActive: true },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { blockedUser: { select: { id: true, name: true, email: true } } },
        });
    }
    /**
     * Logs a failed attempt from an IP address.
     * If the allowed attempts are exceeded, the IP will be automatically blocked.
     * @param ipAddress - The IP address of the failed attempt.
     * @returns A promise that resolves when the attempt is logged.
     */
    async recordFailedAttempt(ipAddress) {
        try {
            // Log the failed attempt in the database
            await main_1.main.prisma.failedAttempt.create({
                data: {
                    ipAddress,
                    attemptTime: new Date(),
                },
            });
            // Check if it exceeds the attempt limit
            const attemptCount = await main_1.main.prisma.failedAttempt.count({
                where: {
                    ipAddress,
                    attemptTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
                },
            });
            // Automatically block after 5 failed attempts
            if (attemptCount >= 5) {
                await this.blockIP(ipAddress, "system", "Automatic block due to multiple failed attempts", new Date(Date.now() + 24 * 60 * 60 * 1000));
                // Send notification if webhook token is valid
                if (this.notifications.webhooks.token) {
                    const notification = new notification_1.Notification();
                    await notification.sendWebhookNotification("Automatic IP Block", `The IP address ${ipAddress} has been automatically blocked due to multiple failed attempts.`, "#FFA500", [
                        { name: "IP Address", value: ipAddress, inline: true },
                        { name: "Reason", value: "Multiple failed attempts", inline: true },
                        { name: "Blocked Duration", value: "24 hours", inline: true },
                    ]);
                }
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("api", `[IPBlocker] Error logging failed attempt from IP ${ipAddress}: ${error}`);
            throw error;
        }
    }
}
exports.IPBlocker = IPBlocker;
