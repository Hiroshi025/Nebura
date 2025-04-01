import { NextFunction, Request, Response } from "express";

import { main } from "@/main";
import { logWithLabel } from "@/shared/utils/functions/console";

export class IPBlocker {
  private static instance: IPBlocker;
  private blockedIPs: Set<string> = new Set();
  private lastUpdate: Date = new Date(0);

  private constructor() {
    this.loadBlockedIPs();
    // Actualizar cada hora
    setInterval(() => this.loadBlockedIPs(), 60 * 60 * 1000);
  }

  public static getInstance(): IPBlocker {
    if (!IPBlocker.instance) {
      IPBlocker.instance = new IPBlocker();
    }
    return IPBlocker.instance;
  }

  private async loadBlockedIPs(): Promise<void> {
    try {
      logWithLabel("IPBlocker", "Loading blocked IPs...");
      const now = new Date();
      const activeBlocks = await main.prisma.blockedIP.findMany({
        where: {
          isActive: true,
          OR: [{ expiresAt: { gt: now } }, { expiresAt: undefined }],
        },
      });

      this.blockedIPs = new Set(activeBlocks.map((block) => block.ipAddress));
      this.lastUpdate = new Date();
      logWithLabel(
        "IPBlocker",
        `${this.blockedIPs.size} Ips is blocked and loaded in memory. Last update: ${this.lastUpdate.toISOString()}`,
      );
    } catch (error) {
      logWithLabel("IPBlocker", `Error loading blocked IPs: ${error}`, "error");
      throw error;
    }
  }

  public async blockIP(
    ipAddress: string,
    userId: string,
    reason?: string,
    expiresAt?: Date,
  ): Promise<void> {
    try {
      await main.prisma.blockedIP.upsert({
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
          blockedLicenseId: "default-license-id", // Replace with an appropriate value
        },
      });

      this.blockedIPs.add(ipAddress);
      logWithLabel(
        "api",
        `[IPBlocker] IP ${ipAddress} bloqueada por ${userId}. Motivo: ${reason || "No especificado"}`,
      );
    } catch (error) {
      logWithLabel("api", `[IPBlocker] Error al bloquear IP ${ipAddress}: ${error}`);
      throw error;
    }
  }

  public async unblockIP(ipAddress: string): Promise<void> {
    try {
      await main.prisma.blockedIP.updateMany({
        where: { ipAddress },
        data: { isActive: false },
      });

      this.blockedIPs.delete(ipAddress);
      logWithLabel("api", `[IPBlocker] IP ${ipAddress} desbloqueada.`);
    } catch (error) {
      logWithLabel("api", `[IPBlocker] Error al desbloquear IP ${ipAddress}: ${error}`);
      throw error;
    }
  }

  public isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  public getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIp = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (typeof clientIp !== "string") {
        return res.status(400).json({ error: "Could not determine IP address" });
      }

      // Extraer la IP real si está detrás de un proxy
      const realIp = clientIp.split(",")[0].trim();

      if (this.isIPBlocked(realIp)) {
        logWithLabel("api", `[IPBlocker] IP ${realIp} bloqueada. Acceso denegado.`);
        return res.status(403).json({
          error: "Access denied",
          reason: "Your IP address has been blocked",
        });
      }

      next();
      return;
    };
  }

  public async getBlockedIPs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return await main.prisma.blockedIP.findMany({
      where: { isActive: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { blockedUser: { select: { id: true, name: true, email: true } } },
    });
  }

  public async recordFailedAttempt(ipAddress: string): Promise<void> {
    try {
      // Registrar el intento fallido en la base de datos
      await main.prisma.failedAttempt.create({
        data: {
          ipAddress,
          attemptTime: new Date(),
        },
      });

      // Verificar si supera el límite de intentos
      const attemptCount = await main.prisma.failedAttempt.count({
        where: {
          ipAddress,
          attemptTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Últimas 24 horas
        },
      });

      // Bloquear automáticamente después de 5 intentos fallidos
      if (attemptCount >= 5) {
        await this.blockIP(
          ipAddress,
          "system",
          "Automatic block due to multiple failed attempts",
          new Date(Date.now() + 24 * 60 * 60 * 1000), // Bloqueo por 24 horas
        );
      }
    } catch (error) {
      logWithLabel(
        "api",
        `[IPBlocker] Error al registrar intento fallido desde IP ${ipAddress}: ${error}`,
      );
      throw error;
    }
  }
}
