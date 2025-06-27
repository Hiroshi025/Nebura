"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="5146b647-dcf1-5131-8653-ec32a98bf3e8")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseIPMiddleware = void 0;
const main_1 = require("../../../main");
const config_1 = require("../../../shared/utils/config");
const console_1 = require("../../../shared/utils/functions/console");
const administrator_1 = require("./administrator");
const notification_1 = require("./notification");
/**
 * Middleware to handle license validation and IP blocking.
 * Ensures that requests are authorized based on license keys, IP addresses, and hardware IDs (HWIDs).
 */
class LicenseIPMiddleware {
    notifications;
    static instance;
    ipBlocker = administrator_1.IPBlocker.getInstance();
    constructor() {
        this.notifications = config_1.config.moderation.notifications;
    }
    /**
     * Retrieves the singleton instance of the LicenseIPMiddleware.
     * @returns {LicenseIPMiddleware} The singleton instance.
     */
    static getInstance() {
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
    async checkLicense(licenseKey, clientIp, hwid) {
        if (!licenseKey) {
            throw new Error("License key is required");
        }
        const license = await main_1.main.prisma.license.findUnique({
            where: { key: licenseKey },
        });
        if (!license) {
            throw new Error("License not found");
        }
        // Verificar IP bloqueada
        if (clientIp && this.ipBlocker.isIPBlocked(clientIp)) {
            // Send notification if webhook token is valid
            if (this.notifications.webhooks.token) {
                const notification = new notification_1.Notification();
                await notification.sendWebhookNotification("Access Denied: IP Blocked", `The IP address ${clientIp} attempted to access with a blocked IP.`, "#FF0000", [{ name: "IP Address", value: clientIp, inline: true }]);
            }
            throw new Error("IP address has been blocked");
        }
        // Verificar HWID si se proporciona
        if (hwid && license.hwid && license.hwid.length > 0 && !license.hwid.includes(hwid)) {
            // Send notification if webhook token is valid
            if (this.notifications.webhooks.token) {
                const notification = new notification_1.Notification();
                await notification.sendWebhookNotification("Access Denied: HWID Mismatch", `The HWID ${hwid} does not match the authorized HWIDs for the license.`, "#FFA500", [
                    { name: "HWID", value: hwid, inline: true },
                    { name: "License Key", value: licenseKey, inline: true },
                ]);
            }
            throw new Error("Unauthorized hardware ID");
        }
        // Verificar fecha de expiración
        if (license.validUntil < new Date()) {
            // Send notification if webhook token is valid
            if (this.notifications.webhooks.token) {
                const notification = new notification_1.Notification();
                await notification.sendWebhookNotification("Access Denied: License Expired", `The license ${licenseKey} has expired.`, "#FF0000", [
                    { name: "License Key", value: licenseKey, inline: true },
                    { name: "Expiration Date", value: license.validUntil.toISOString(), inline: true },
                ]);
            }
            throw new Error("License has expired");
        }
        // Verificar límite de solicitudes
        if (license.requestLimit && license.requestCount >= license.requestLimit) {
            // Send notification if webhook token is valid
            if (this.notifications.webhooks.token) {
                const notification = new notification_1.Notification();
                await notification.sendWebhookNotification("Access Denied: Request Limit Exceeded", `The license ${licenseKey} has exceeded its request limit.`, "#FF0000", [
                    { name: "License Key", value: licenseKey, inline: true },
                    { name: "Request Limit", value: license.requestLimit.toString(), inline: true },
                ]);
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
    getMiddleware() {
        return async (req, res, next) => {
            try {
                const licenseKey = req.headers["x-license-key"];
                const clientIp = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
                const hwid = req.headers["x-hwid"];
                // Extraer la IP real si está detrás de un proxy
                const realIp = typeof clientIp === "string" ? clientIp.split(",")[0].trim() : "";
                const license = await this.checkLicense(licenseKey, realIp, hwid);
                const ips = license.ips || [];
                // Verificar si la IP ya está registrada
                if (realIp && !ips.includes(realIp)) {
                    ips.push(realIp); // Agregar la IP a la lista si no está ya registrada
                }
                //verificar si hay mas ips registradas que el maximo permitido
                if (license.maxIps && ips.length > license.maxIps) {
                    // Eliminar la IP más antigua si se supera el límite
                    ips.shift();
                }
                // Incrementar el contador de solicitudes
                await main_1.main.prisma.license.update({
                    where: { key: licenseKey },
                    data: {
                        requestCount: { increment: 1 },
                        lastUsedIp: realIp,
                        ...(hwid ? { lastUsedHwid: hwid } : {}),
                        ips: ips, // Actualizar la lista de IPs
                    },
                });
                // Adjuntar información de licencia e IP a la solicitud
                req.license = {
                    ...license,
                    type: ["FREE", "BASIC", "PREMIUM"].includes(license.type)
                        ? license.type
                        : "FREE",
                };
                req.clientIp = realIp;
                next();
            }
            catch (error) {
                (0, console_1.logWithLabel)("LicenseIP", "Error in LicenseIPMiddleware " + error.message);
                // Registrar intento fallido para posible bloqueo automático
                if (req.clientIp) {
                    await this.recordFailedAttempt(req.clientIp);
                }
                res.status(403).json({
                    error: "Access denied",
                    reason: "Invalid license",
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
    async recordFailedAttempt(_ipAddress) {
        try {
            // Implementar lógica para registrar intentos fallidos
            // y bloquear IPs después de cierto número de intentos
            (0, console_1.logWithLabel)("IPBlocker", "The IP has been blocked due to failed attempts");
            // Send notification if webhook token is valid
            if (this.notifications.webhooks.token) {
                const notification = new notification_1.Notification();
                await notification.sendWebhookNotification("Failed Attempt Logged", `A failed attempt was logged for IP address ${_ipAddress}.`, "#FFA500", [{ name: "IP Address", value: _ipAddress, inline: true }]);
            }
            // Ejemplo: Bloquear después de 5 intentos fallidos
            // (Implementar lógica completa según tus necesidades)
        }
        catch (error) {
            (0, console_1.logWithLabel)("IPBlocker", "Error the IP has been blocked");
        }
    }
    /**
     * Maps error messages to specific error codes.
     * @param message - The error message to map.
     * @returns {string} The corresponding error code.
     */
    getErrorCode(message) {
        const codes = {
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
exports.LicenseIPMiddleware = LicenseIPMiddleware;
//# sourceMappingURL=license.js.map
//# debugId=5146b647-dcf1-5131-8653-ec32a98bf3e8
