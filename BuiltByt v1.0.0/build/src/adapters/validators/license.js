"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="955a5c06-448b-5ee6-9110-9de35ae397a3")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLicenseSchema = exports.CreateLicenseSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.CreateLicenseSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(client_1.LicenseType),
    userId: zod_1.z.string().min(1),
    adminId: zod_1.z.string().min(1),
    hwid: zod_1.z.array(zod_1.z.string()),
    requestLimit: zod_1.z.number().optional(),
    validUntil: zod_1.z.coerce.date(),
});
exports.UpdateLicenseSchema = zod_1.z.object({
    hwid: zod_1.z.array(zod_1.z.string()).optional(),
    requestLimit: zod_1.z.number().optional(),
    validUntil: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=license.js.map
//# debugId=955a5c06-448b-5ee6-9110-9de35ae397a3
