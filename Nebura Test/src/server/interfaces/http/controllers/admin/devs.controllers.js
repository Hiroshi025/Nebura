"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityController = void 0;
const apicache_1 = __importDefault(require("apicache"));
const main_1 = require("../../../../../main");
class SecurityController {
    async getLicenseInfo(req, res) {
        try {
            const { licenseKey } = req.params;
            const license = await main_1.main.prisma.license.findUnique({
                where: { id: licenseKey },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    admin: { select: { id: true, name: true, email: true } },
                    // blockedIps property removed as it does not exist in the license type
                },
            });
            if (!license) {
                return res.status(404).json({ error: req.t("errors:license_not_found") });
            }
            const blockedIPs = await main_1.main.prisma.blockedIP.findMany({
                where: {
                    ipAddress: { in: [] }, // Adjusted to avoid referencing a non-existent property
                },
            });
            return res.json({
                license,
                blockedIPs,
                usageStats: {
                    requestCount: license.requestCount,
                    requestLimit: license.requestLimit,
                    lastUsedIp: license.lastUsedIp,
                },
            });
        }
        catch (error) {
            return res.status(500).json({ error: req.t("errors:failed_to_retrieve_license_info") });
        }
    }
    async getIpInfo(req, res) {
        try {
            const { ipAddress } = req.params;
            const blockedInfo = await main_1.main.prisma.blockedIP.findFirst({
                where: { ipAddress },
                include: { blockedUser: { select: { id: true, name: true } } },
            });
            if (!blockedInfo)
                return res.status(404).json({
                    data: null,
                    error: req.t("errors:ip_not_found"),
                });
            const failedAttempts = await main_1.main.prisma.failedAttempt.count({
                where: { ipAddress },
            });
            const licenseUsage = await main_1.main.prisma.license.findMany({
                where: { lastUsedIp: ipAddress },
                select: { id: true, type: true },
            });
            return res.json({
                ipAddress,
                isBlocked: !!blockedInfo,
                blockedInfo,
                failedAttempts,
                licenseUsage,
            });
        }
        catch (error) {
            return res.status(500).json({ error: req.t("errors:failed_to_retrieve_ip_info") });
        }
    }
    async cacheInfo(req, res) {
        try {
            return res.status(200).json(await apicache_1.default.getPerformance());
        }
        catch (error) {
            return res.status(500).json({ error: req.t("errors:failed_to_retrieve_cache_info") });
        }
    }
    async cacheIndex(req, res) {
        try {
            const cache = apicache_1.default.getIndex();
            return res.status(200).json(cache);
        }
        catch (error) {
            return res.status(500).json({ error: req.t("errors:failed_to_retrieve_cache_index") });
        }
    }
}
exports.SecurityController = SecurityController;
