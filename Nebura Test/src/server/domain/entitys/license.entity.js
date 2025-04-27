"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseEntity = void 0;
class LicenseEntity {
    id;
    type;
    userId;
    adminId;
    hwid = [];
    requestLimit = 1000;
    requestCount = 0;
    validUntil;
    createdAt;
    updatedAt;
    constructor(partial) {
        Object.assign(this, partial);
    }
}
exports.LicenseEntity = LicenseEntity;
