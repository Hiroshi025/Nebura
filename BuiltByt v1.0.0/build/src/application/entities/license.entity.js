"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="3bb84b27-8960-580e-8d7c-93d8cb2a3df9")}catch(e){}}();

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
//# sourceMappingURL=license.entity.js.map
//# debugId=3bb84b27-8960-580e-8d7c-93d8cb2a3df9
