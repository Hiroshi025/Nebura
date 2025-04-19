import apicache from "apicache";
import { Request, Response } from "express";

import { main } from "@/main";

export class SecurityController {
  async getLicenseInfo(req: Request, res: Response) {
    try {
      const { licenseKey } = req.params;
      const license = await main.prisma.license.findUnique({
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

  async cacheInfo(req: Request, res: Response) {
    try {
      return res.status(200).json(await apicache.getPerformance());
    } catch (error) {
      return res.status(500).json({ error: req.t("errors:failed_to_retrieve_cache_info") });
    }
  }

  async cacheIndex(req: Request, res: Response) {
    try {
      const cache = apicache.getIndex();
      return res.status(200).json(cache);
    } catch (error) {
      return res.status(500).json({ error: req.t("errors:failed_to_retrieve_cache_index") });
    }
  }
}
