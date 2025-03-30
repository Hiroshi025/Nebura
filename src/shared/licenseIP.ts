import { NextFunction, Request, Response } from "express";

import { main } from "@/main";

import { IPBlocker } from "./ipBlocker";
import { logWithLabel } from "./utils/functions/console";

export class LicenseIPMiddleware {
  private static instance: LicenseIPMiddleware;
  private ipBlocker = IPBlocker.getInstance();

  private constructor() {}

  public static getInstance(): LicenseIPMiddleware {
    if (!LicenseIPMiddleware.instance) {
      LicenseIPMiddleware.instance = new LicenseIPMiddleware();
    }
    return LicenseIPMiddleware.instance;
  }

  private async checkLicense(licenseKey: string, clientIp?: string, hwid?: string) {
    if (!licenseKey) {
      throw new Error("License key is required");
    }

    const license = await main.prisma.license.findUnique({
      where: { id: licenseKey },
      include: { user: true, admin: true },
    });

    if (!license) {
      throw new Error("License not found");
    }

    // Verificar IP bloqueada
    if (clientIp && this.ipBlocker.isIPBlocked(clientIp)) {
      throw new Error("IP address has been blocked");
    }

    // Verificar HWID si se proporciona
    if (hwid && license.hwid && license.hwid.length > 0 && !license.hwid.includes(hwid)) {
      throw new Error("Unauthorized hardware ID");
    }

    // Verificar fecha de expiración
    if (license.validUntil < new Date()) {
      throw new Error("License has expired");
    }

    // Verificar límite de solicitudes
    if (license.requestLimit && license.requestCount >= license.requestLimit) {
      throw new Error("Request limit exceeded");
    }

    return license;
  }

  public getMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const licenseKey = req.headers["x-license-key"] as string;
        const clientIp = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const hwid = req.headers["x-hwid"] as string;

        // Extraer la IP real si está detrás de un proxy
        const realIp = typeof clientIp === "string" ? clientIp.split(",")[0].trim() : "";

        const license = await this.checkLicense(licenseKey, realIp, hwid);

        // Incrementar el contador de solicitudes
        await main.prisma.license.update({
          where: { id: licenseKey },
          data: {
            requestCount: { increment: 1 },
            lastUsedIp: realIp,
            ...(hwid ? { lastUsedHwid: hwid } : {}),
          },
        });

        // Adjuntar información de licencia e IP a la solicitud
        req.license = {
          ...license,
          type: ["FREE", "BASIC", "PREMIUM"].includes(license.type as string)
            ? (license.type as "FREE" | "BASIC" | "PREMIUM")
            : "FREE",
        };
        req.clientIp = realIp;

        next();
      } catch (error: any) {
        logWithLabel("LicenseIP", "Error in LicenseIPMiddleware " + error.message);

        // Registrar intento fallido para posible bloqueo automático
        if (req.clientIp) {
          await this.recordFailedAttempt(req.clientIp);
        }

        res.status(403).json({
          error: "Access denied",
          reason: error.message,
          code: this.getErrorCode(error.message),
        });
      }
    };
  }

  private async recordFailedAttempt(_ipAddress: string) {
    try {
      // Implementar lógica para registrar intentos fallidos
      // y bloquear IPs después de cierto número de intentos
      logWithLabel("IPBlocker", "The IP has been blocked due to failed attempts");

      // Ejemplo: Bloquear después de 5 intentos fallidos
      // (Implementar lógica completa según tus necesidades)
    } catch (error) {
      logWithLabel("IPBlocker", "Error the IP has been blocked");
    }
  }

  private getErrorCode(message: string): string {
    const codes: Record<string, string> = {
      "License key is required": "LICENSE_REQUIRED",
      "License not found": "LICENSE_NOT_FOUND",
      "IP address has been blocked": "IP_BLOCKED",
      "Unauthorized hardware ID": "HWID_MISMATCH",
      "License has expired": "LICENSE_EXPIRED",
      "Request limit exceeded": "REQUEST_LIMIT_EXCEEDED",
    };

    return codes[message] || "ACCESS_DENIED";
  }
}