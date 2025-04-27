"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseService = void 0;
const main_1 = require("../../../../main");
const license_entity_1 = require("../../entitys/license.entity");
class LicenseService {
    async create(createDto) {
        const license = await main_1.main.prisma.license.create({
            data: {
                ...createDto,
                requestLimit: createDto.requestLimit || 1000,
                requestCount: 0,
            },
            include: {
                user: true,
                admin: true,
            },
        });
        return new license_entity_1.LicenseEntity(license);
    }
    async findAll() {
        const licenses = await main_1.main.prisma.license.findMany({
            include: { user: true, admin: true },
        });
        return licenses.map((license) => new license_entity_1.LicenseEntity(license));
    }
    async findById(id) {
        const license = await main_1.main.prisma.license.findUnique({
            where: { id },
            include: { user: true, admin: true },
        });
        return license ? new license_entity_1.LicenseEntity(license) : null;
    }
    async findByUserId(userId) {
        const licenses = await main_1.main.prisma.license.findMany({
            where: { userId },
            include: { user: true, admin: true },
        });
        return licenses.map((license) => new license_entity_1.LicenseEntity(license));
    }
    async update(id, updateDto) {
        const license = await main_1.main.prisma.license.update({
            where: { id },
            data: updateDto,
            include: { user: true, admin: true },
        });
        return new license_entity_1.LicenseEntity(license);
    }
    async delete(id) {
        await main_1.main.prisma.license.delete({ where: { id } });
    }
    async validateLicense(key, hwid) {
        const license = await main_1.main.prisma.license.findUnique({ where: { id: key } });
        if (!license || license.validUntil < new Date() || !license.hwid.includes(hwid)) {
            return false;
        }
        await main_1.main.prisma.license.update({
            where: { id: key },
            data: { requestCount: { increment: 1 } },
        });
        return license.requestCount < license.requestLimit;
    }
}
exports.LicenseService = LicenseService;
