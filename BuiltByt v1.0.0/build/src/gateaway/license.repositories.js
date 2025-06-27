"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="e9742b85-c233-5598-bb69-727b47b6546c")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseRepository = void 0;
const main_1 = require("../main");
class LicenseRepository {
    constructor() { }
    async findLicenseMany() {
        const data = await main_1.main.prisma.license.findMany();
        return data;
    }
    async findLicenseById(id) {
        const data = await main_1.main.prisma.license.findUnique({
            where: { id },
        });
        return data ? data : false;
    }
    async findLicenseByKey(key) {
        const data = await main_1.main.prisma.license.findUnique({
            where: { key },
        });
        return data ? data : false;
    }
    async findLicenseByUserId(userId) {
        const data = await main_1.main.prisma.license.findMany({
            where: { userId },
        });
        return data;
    }
    async updateLicenseById(id, data) {
        try {
            const updatedData = await main_1.main.prisma.license.update({
                where: { id },
                data,
            });
            return updatedData;
        }
        catch (e) {
            throw new Error(e instanceof Error ? e.message : "Unknown repository error");
        }
    }
    async deleteLicenseById(id) {
        try {
            const data = await main_1.main.prisma.license.delete({
                where: { id },
            });
            return data ? data : false;
        }
        catch (e) {
            throw new Error(e instanceof Error ? e.message : "Unknown repository error");
        }
    }
    async updateRequestLicenseById(id) {
        try {
            const data = await main_1.main.prisma.license.update({
                where: { id },
                data: { requestCount: { increment: 1 } },
            });
            return data ? data : false;
        }
        catch (e) {
            throw new Error(e instanceof Error ? e.message : "Unknown repository error");
        }
    }
    async createLicence(data) {
        try {
            if (data.validUntil === undefined) {
                throw new Error("validUntil is required and cannot be undefined");
            }
            const license = await main_1.main.prisma.license.create({
                data: {
                    ...data,
                    validUntil: data.validUntil
                }
            });
            return license;
        }
        catch (e) {
            throw new Error(e instanceof Error ? e.message : "Unknown repository error");
        }
    }
}
exports.LicenseRepository = LicenseRepository;
//# sourceMappingURL=license.repositories.js.map
//# debugId=e9742b85-c233-5598-bb69-727b47b6546c
