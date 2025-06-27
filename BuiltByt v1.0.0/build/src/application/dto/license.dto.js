"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="083f899d-2e51-5d4b-9d2b-129145243b32")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLicenseDto = exports.CreateLicenseDto = void 0;
class CreateLicenseDto {
    key;
    type;
    userId;
    adminId;
    hwid;
    requestLimit;
    validUntil;
}
exports.CreateLicenseDto = CreateLicenseDto;
class UpdateLicenseDto {
    hwid;
    requestLimit;
    validUntil;
}
exports.UpdateLicenseDto = UpdateLicenseDto;
//# sourceMappingURL=license.dto.js.map
//# debugId=083f899d-2e51-5d4b-9d2b-129145243b32
