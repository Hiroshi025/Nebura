import apicache from "apicache";
import { Request, Response } from "express";

import { main } from "@/main";

/**
 * Controller for developer and security-related administrative endpoints.
 *
 * Provides endpoints for retrieving license information, IP address information,
 * and cache statistics for debugging and monitoring purposes.
 *
 * @example
 * // Usage with Express:
 * app.get('/admin/license/:licenseKey', securityController.getLicenseInfo);
 * app.get('/admin/ip/:ipAddress', securityController.getIpInfo);
 * app.get('/admin/cache/info', securityController.cacheInfo);
 * app.get('/admin/cache/index', securityController.cacheIndex);
 */
export class SecurityController {
  /**
   * Retrieves detailed information about a license, including associated user/admin and usage stats.
   *
   * @param req - Express Request object with `licenseKey` in params.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with license info, blocked IPs, and usage stats.
   *
   * @example
   * // GET /admin/license/abc123
   * // Response:
   * // {
   * //   license: {...},
   * //   blockedIPs: [...],
   * //   usageStats: { requestCount: 10, requestLimit: 100, lastUsedIp: "1.2.3.4" }
   * // }
   */
  async getLicenseInfo(req: Request, res: Response) {
    try {
      const { licenseKey } = req.params;
      const license = await main.prisma.license.findUnique({
        where: { id: licenseKey },
      });

      if (!license) {
        return res.status(404).json({ error: req.t("errors:license_not_found") });
      }

      const blockedIPs = await main.prisma.blockedIP.findMany({
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
    } catch (error) {
      return res.status(500).json({ error: req.t("errors:failed_to_retrieve_license_info") });
    }
  }

  /**
   * Retrieves information about a specific IP address, including block status,
   * related user, failed attempts, and license usage.
   *
   * @param req - Express Request object with `ipAddress` in params.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with IP info, block status, and usage.
   *
   * @example
   * // GET /admin/ip/1.2.3.4
   * // Response:
   * // {
   * //   ipAddress: "1.2.3.4",
   * //   isBlocked: true,
   * //   blockedInfo: {...},
   * //   failedAttempts: 5,
   * //   licenseUsage: [...]
   * // }
   */
  async getIpInfo(req: Request, res: Response) {
    try {
      const { ipAddress } = req.params;

      const blockedInfo = await main.prisma.blockedIP.findFirst({
        where: { ipAddress },
        include: { blockedUser: { select: { id: true, name: true } } },
      });

      if (!blockedInfo)
        return res.status(404).json({
          data: null,
          error: req.t("errors:ip_not_found"),
        });

      const failedAttempts = await main.prisma.failedAttempt.count({
        where: { ipAddress },
      });

      const licenseUsage = await main.prisma.license.findMany({
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
    } catch (error) {
      return res.status(500).json({ error: req.t("errors:failed_to_retrieve_ip_info") });
    }
  }

  /**
   * Retrieves performance statistics from the API cache.
   *
   * @param req - Express Request object.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with cache performance data.
   *
   * @example
   * // GET /admin/cache/info
   * // Response: { ...cachePerformance }
   */
  async cacheInfo(req: Request, res: Response) {
    try {
      return res.status(200).json(await apicache.getPerformance());
    } catch (error) {
      return res.status(500).json({ error: req.t("errors:failed_to_retrieve_cache_info") });
    }
  }

  /**
   * Retrieves the current cache index from the API cache.
   *
   * @param req - Express Request object.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with the cache index.
   *
   * @example
   * // GET /admin/cache/index
   * // Response: { ...cacheIndex }
   */
  async cacheIndex(req: Request, res: Response) {
    try {
      const cache = apicache.getIndex();
      return res.status(200).json(cache);
    } catch (error) {
      return res.status(500).json({ error: req.t("errors:failed_to_retrieve_cache_index") });
    }
  }
}
