"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="3dca0a2c-f98e-5fcf-9fc3-033fd30f356f")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseService = void 0;
const discord_js_1 = require("discord.js");
const license_1 = require("../../../adapters/validators/license");
const license_entity_1 = require("../../../application/entities/license.entity");
const license_repositories_1 = require("../../../gateaway/license.repositories");
const notification_1 = require("../../../interfaces/messaging/broker/notification"); // Importa Notification
const main_1 = require("../../../main");
const embeds_extend_1 = require("../../../shared/adapters/extends/embeds.extend");
/**
 * Service for managing software licenses.
 *
 * Provides methods to create, retrieve, update, delete, and validate licenses.
 *
 * @see [Prisma Documentation](https://www.prisma.io/docs/)
 */
class LicenseService {
    notifier = new notification_1.Notification(); // Instancia de Notification
    licenseRepository = new license_repositories_1.LicenseRepository(); // Instancia del repositorio de licencias
    /**
     * Creates a new license in the system.
     *
     * @param createDto - Data Transfer Object containing license creation data.
     * @returns A promise that resolves to the created LicenseEntity.
     *
     * @example
     * ```typescript
     * const license = await licenseService.createLicense(createDto);
     * ```
     */
    async createLicense(createDto) {
        // Validación con Zod
        license_1.CreateLicenseSchema.parse(createDto);
        const { userId, adminId, validUntil, key, ...licenseData } = createDto;
        const licenseDataToCreate = {
            ...licenseData,
            key,
            type: createDto.type,
            userId,
            adminId,
            hwid: createDto.hwid ? createDto.hwid : [],
            requestLimit: createDto.requestLimit || 1000,
            requestCount: 0,
            validUntil: validUntil ? new Date(validUntil) : undefined,
        };
        // Asegúrate de no enviar 'id' en el payload
        delete licenseDataToCreate.id;
        const license = await this.licenseRepository.createLicence(licenseDataToCreate);
        // Notificación detallada en inglés
        await this.notifier.sendWebhookNotification("License Created", `A new license has been created for user ID: \`${userId}\`. License key: \`${key}\`.`, "#4CAF50", [
            { name: "Type", value: String(createDto.type), inline: true },
            {
                name: "Valid Until",
                value: validUntil ? new Date(validUntil).toISOString() : "Unlimited",
                inline: true,
            },
            {
                name: "HWID(s)",
                value: createDto.hwid && createDto.hwid.length > 0 ? createDto.hwid.join(", ") : "None",
                inline: false,
            },
        ], { content: "🟢 License creation event", username: "License Service" });
        const user = await main_1.client.users.cache.get(userId);
        if (user) {
            await user.send({
                content: (0, discord_js_1.userMention)(user.id),
                embeds: [
                    new embeds_extend_1.EmbedCorrect()
                        .setTitle("License Created Successfully")
                        .setDescription(`Your license with key \`${key}\` has been created successfully.`)
                        .addFields({
                        name: "Type",
                        value: String(createDto.type),
                        inline: true,
                    }, {
                        name: "Valid Until",
                        value: validUntil ? new Date(validUntil).toISOString() : "Unlimited",
                        inline: true,
                    }, {
                        name: "HWID(s)",
                        value: createDto.hwid && createDto.hwid.length > 0 ? createDto.hwid.join(", ") : "None",
                        inline: false,
                    }),
                ],
            });
        }
        return new license_entity_1.LicenseEntity(license);
    }
    /**
     * Retrieves all licenses from the database.
     *
     * @returns A promise that resolves to an array of LicenseEntity objects.
     *
     * @example
     * ```typescript
     * const licenses = await licenseService.findAllLicense();
     * ```
     */
    async findAllLicense() {
        const licenses = await this.licenseRepository.findLicenseMany();
        return licenses.map((license) => new license_entity_1.LicenseEntity(license));
    }
    /**
     * Finds a license by its unique identifier.
     *
     * @param id - The unique ID of the license.
     * @returns A promise that resolves to the LicenseEntity if found, or null otherwise.
     *
     * @example
     * ```typescript
     * const license = await licenseService.findByIdLicense("licenseId");
     * ```
     */
    async findByIdLicense(id) {
        const license = await this.licenseRepository.findLicenseById(id);
        return license ? new license_entity_1.LicenseEntity(license) : null;
    }
    /**
     * Finds a license by its license key.
     *
     * @param key - The license key.
     * @returns A promise that resolves to the LicenseEntity if found, or null otherwise.
     *
     * @example
     * ```typescript
     * const license = await licenseService.findByKeyLicense("LICENSE-KEY-123");
     * ```
     */
    async findByKeyLicense(key) {
        const license = await this.licenseRepository.findLicenseByKey(key);
        return license ? new license_entity_1.LicenseEntity(license) : null;
    }
    /**
     * Retrieves all licenses associated with a specific user.
     *
     * @param userId - The user's unique identifier.
     * @returns A promise that resolves to an array of LicenseEntity objects.
     *
     * @example
     * ```typescript
     * const userLicenses = await licenseService.findByUserIdLicense("userId123");
     * ```
     */
    async findByUserIdLicense(userId) {
        const licenses = await this.licenseRepository.findLicenseByUserId(userId);
        return licenses.map((license) => new license_entity_1.LicenseEntity(license));
    }
    /**
     * Updates a license by its unique identifier.
     *
     * @param id - The unique ID of the license.
     * @param updateDto - Data Transfer Object containing updated license data.
     * @returns A promise that resolves to the updated LicenseEntity.
     *
     * @example
     * ```typescript
     * const updated = await licenseService.updateLicense("licenseId", updateDto);
     * ```
     */
    async updateLicense(id, updateDto) {
        // Validación con Zod
        license_1.UpdateLicenseSchema.parse(updateDto);
        // Permite actualizar por id (ObjectId)
        const license = await this.licenseRepository.updateLicenseById(id, updateDto);
        await this.notifier.sendWebhookNotification("License Updated", `License with ID: \`${id}\` has been updated.`, "#2196F3", [
            {
                name: "Updated Fields",
                value: Object.keys(updateDto).join(", ") || "None",
                inline: false,
            },
        ], { content: "🔵 License update event", username: "License Service" });
        return new license_entity_1.LicenseEntity(license);
    }
    /**
     * Updates a license by its license key.
     *
     * @param key - The license key.
     * @param updateDto - Data Transfer Object containing updated license data.
     * @returns A promise that resolves to the updated LicenseEntity, or null if not found.
     *
     * @example
     * ```typescript
     * const updated = await licenseService.updateByKeyLicense("LICENSE-KEY-123", updateDto);
     * ```
     */
    async updateByKeyLicense(key, updateDto) {
        // Validación con Zod
        license_1.UpdateLicenseSchema.parse(updateDto);
        // Permite actualizar por key (clave de licencia)
        const data = await this.licenseRepository.findLicenseByKey(key);
        if (!data)
            return null;
        const license = await this.licenseRepository.updateLicenseById(data.id, updateDto);
        await this.notifier.sendWebhookNotification("License Updated by Key", `License with key: \`${key}\` has been updated.`, "#2196F3", [
            {
                name: "Updated Fields",
                value: Object.keys(updateDto).join(", ") || "None",
                inline: false,
            },
        ], { content: "🔵 License update by key event", username: "License Service" });
        return new license_entity_1.LicenseEntity(license);
    }
    /**
     * Deletes a license by its unique identifier.
     *
     * @param id - The unique ID or key of the license.
     * @returns A promise that resolves to the deleted license object or false if not found.
     *
     * @example
     * ```typescript
     * const result = await licenseService.deleteLicense("licenseId");
     * ```
     */
    async deleteLicense(id) {
        const data = await this.licenseRepository.findLicenseById(id);
        if (!data)
            return false;
        const deleted = await this.licenseRepository.deleteLicenseById(id);
        if (!deleted)
            return false;
        await this.notifier.sendWebhookNotification("License Deleted", `License with key: \`${id}\` has been deleted.`, "#F44336", [
            { name: "Deleted License ID", value: deleted.id, inline: true },
            { name: "Key", value: deleted.key, inline: true },
        ], { content: "🔴 License deletion event", username: "License Service" });
        return deleted;
    }
    /**
     * Deletes a license by its license key.
     *
     * @param key - The license key.
     * @returns A promise that resolves to the deleted license object or false if not found.
     *
     * @example
     * ```typescript
     * const result = await licenseService.deleteByKeyLicense("LICENSE-KEY-123");
     * ```
     */
    async deleteByKeyLicense(key) {
        const data = await this.licenseRepository.findLicenseByKey(key);
        if (!data)
            return false;
        const deleted = await this.licenseRepository.deleteLicenseById(data.id);
        if (!deleted)
            return false;
        await this.notifier.sendWebhookNotification("License Deleted by Key", `License with key: \`${key}\` has been deleted.`, "#F44336", [
            { name: "Deleted License ID", value: deleted.id, inline: true },
            { name: "Key", value: deleted.key, inline: true },
        ], { content: "🔴 License deletion by key event", username: "License Service" });
        return deleted;
    }
    /**
     * Validates a license by its key and hardware ID (HWID).
     *
     * Checks if the license exists, is not expired, and the HWID is registered.
     * Increments the request count if valid.
     *
     * @param key - The license key.
     * @param hwid - The hardware ID to validate.
     * @returns A promise that resolves to true if the license is valid, false otherwise.
     *
     * @see [Software Licensing Concepts](https://en.wikipedia.org/wiki/Software_license)
     *
     * @example
     * ```typescript
     * const isValid = await licenseService.validateLicense("LICENSE-KEY-123", "HWID-XYZ");
     * ```
     */
    async validateLicense(key, hwid) {
        const license = await this.licenseRepository.findLicenseByKey(key);
        let valid = false;
        let reason = "";
        if (!license) {
            reason = "License not found";
        }
        else if (license.validUntil && license.validUntil < new Date()) {
            reason = "License expired";
        }
        else if (!license.hwid || !license.hwid.includes(hwid)) {
            reason = "HWID not registered";
        }
        else if (license.requestCount >= license.requestLimit) {
            reason = "Request limit reached";
        }
        else {
            valid = true;
        }
        if (valid && license) {
            await this.licenseRepository.updateRequestLicenseById(license.id);
        }
        await this.notifier.sendWebhookNotification("License Validation Attempt", `A license validation was attempted for key: \`${key}\` and HWID: \`${hwid}\`.`, valid ? "#4CAF50" : "#F44336", [
            { name: "Validation Result", value: valid ? "✅ Valid" : "❌ Invalid", inline: true },
            { name: "Reason", value: valid ? "All checks passed" : reason, inline: false },
            {
                name: "Request Count",
                value: license ? `${license.requestCount}/${license.requestLimit}` : "N/A",
                inline: true,
            },
        ], { content: "🔔 License validation event", username: "License Service" });
        return valid;
    }
}
exports.LicenseService = LicenseService;
//# sourceMappingURL=license.service.js.map
//# debugId=3dca0a2c-f98e-5fcf-9fc3-033fd30f356f
