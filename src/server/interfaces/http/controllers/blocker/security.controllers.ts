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
          blockedIps: true,
        },
      });

      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }

      const blockedIPs = await main.prisma.blockedIP.findMany({
        where: {
          ipAddress: { in: (license.blockedIps || []).map((ip) => ip.ipAddress) },
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
      return res.status(500).json({ error: "Failed to retrieve license info" });
    }
  }

  async getIpInfo(req: Request, res: Response) {
    try {
      const { ipAddress } = req.params;

      const blockedInfo = await main.prisma.blockedIP.findFirst({
        where: { ipAddress },
        include: { blockedUser: { select: { id: true, name: true } } },
      });

      const failedAttempts = await main.prisma.failedAttempt.count({
        where: { ipAddress },
      });

      const licenseUsage = await main.prisma.license.findMany({
        where: { lastUsedIp: ipAddress },
        select: { id: true, type: true },
      });

      res.json({
        ipAddress,
        isBlocked: !!blockedInfo,
        blockedInfo,
        failedAttempts,
        licenseUsage,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve IP info" });
    }
  }
}
