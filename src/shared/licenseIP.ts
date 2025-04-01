import { NextFunction, Request, Response } from "express";

import { main } from "@/main";

import { IPBlocker } from "./ipBlocker";
import { Notification } from "./notification";
import { config } from "./utils/config";
import { logWithLabel } from "./utils/functions/console";

/**
 * Middleware to handle license validation and IP blocking.
 * Ensures that requests are authorized based on license keys, IP addresses, and hardware IDs (HWIDs).
 */
export class LicenseIPMiddleware {
  private notifications: typeof config.moderation.notifications;
  private static instance: LicenseIPMiddleware;
  private ipBlocker = IPBlocker.getInstance();

  private constructor() {
    this.notifications = config.moderation.notifications;
  }

  /**
   * Retrieves the singleton instance of the LicenseIPMiddleware.
   * @returns {LicenseIPMiddleware} The singleton instance.
   */
  public static getInstance(): LicenseIPMiddleware {
    if (!LicenseIPMiddleware.instance) {
      LicenseIPMiddleware.instance = new LicenseIPMiddleware();
    }
    return LicenseIPMiddleware.instance;
  }

  /**
   * Validates the provided license key, client IP, and hardware ID (HWID).
   * @param licenseKey - The license key to validate.
   * @param clientIp - The IP address of the client making the request.
   * @param hwid - The hardware ID of the client making the request.
   * @throws Will throw an error if the license is invalid, expired, or unauthorized.
   * @returns The validated license object.
   */
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
      // Send notification if webhook token is valid
      if (this.notifications.webhooks.token) {
        const notification = new Notification();
        await notification.sendWebhookNotification(
          "Access Denied: IP Blocked",
          `The IP address ${clientIp} attempted to access with a blocked IP.`,
          "#FF0000",
          [{ name: "IP Address", value: clientIp, inline: true }],
        );
      }
      throw new Error("IP address has been blocked");
    }

    // Verificar HWID si se proporciona
    if (hwid && license.hwid && license.hwid.length > 0 && !license.hwid.includes(hwid)) {
      // Send notification if webhook token is valid
      if (this.notifications.webhooks.token) {
        const notification = new Notification();
        await notification.sendWebhookNotification(
          "Access Denied: HWID Mismatch",
          `The HWID ${hwid} does not match the authorized HWIDs for the license.`,
          "#FFA500",
          [
            { name: "HWID", value: hwid, inline: true },
            { name: "License Key", value: licenseKey, inline: true },
          ],
        );
      }
      throw new Error("Unauthorized hardware ID");
    }

    // Verificar fecha de expiración
    if (license.validUntil < new Date()) {
      // Send notification if webhook token is valid
      if (this.notifications.webhooks.token) {
        const notification = new Notification();
        await notification.sendWebhookNotification(
          "Access Denied: License Expired",
          `The license ${licenseKey} has expired.`,
          "#FF0000",
          [
            { name: "License Key", value: licenseKey, inline: true },
            { name: "Expiration Date", value: license.validUntil.toISOString(), inline: true },
          ],
        );
      }
      throw new Error("License has expired");
    }

    // Verificar límite de solicitudes
    if (license.requestLimit && license.requestCount >= license.requestLimit) {
      // Send notification if webhook token is valid
      if (this.notifications.webhooks.token) {
        const notification = new Notification();
        await notification.sendWebhookNotification(
          "Access Denied: Request Limit Exceeded",
          `The license ${licenseKey} has exceeded its request limit.`,
          "#FF0000",
          [
            { name: "License Key", value: licenseKey, inline: true },
            { name: "Request Limit", value: license.requestLimit.toString(), inline: true },
          ],
        );
      }
      throw new Error("Request limit exceeded");
    }

    return license;
  }

  /**
   * Returns the Express middleware function for license validation.
   * This middleware validates the license key, client IP, and HWID, and attaches license information to the request object.
   * @returns {Function} The middleware function.
   */
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

  /**
   * Records a failed attempt for a specific IP address.
   * This method can be extended to implement automatic IP blocking after a certain number of failed attempts.
   * @param _ipAddress - The IP address to record the failed attempt for.
   */
  private async recordFailedAttempt(_ipAddress: string) {
    try {
      // Implementar lógica para registrar intentos fallidos
      // y bloquear IPs después de cierto número de intentos
      logWithLabel("IPBlocker", "The IP has been blocked due to failed attempts");

      // Send notification if webhook token is valid
      if (this.notifications.webhooks.token) {
        const notification = new Notification();
        await notification.sendWebhookNotification(
          "Failed Attempt Logged",
          `A failed attempt was logged for IP address ${_ipAddress}.`,
          "#FFA500",
          [{ name: "IP Address", value: _ipAddress, inline: true }],
        );
      }

      // Ejemplo: Bloquear después de 5 intentos fallidos
      // (Implementar lógica completa según tus necesidades)
    } catch (error) {
      logWithLabel("IPBlocker", "Error the IP has been blocked");
    }
  }

  /**
   * Maps error messages to specific error codes.
   * @param message - The error message to map.
   * @returns {string} The corresponding error code.
   */
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
