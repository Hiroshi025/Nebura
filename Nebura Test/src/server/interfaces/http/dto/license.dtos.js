"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLicenseDto = exports.CreateLicenseDto = void 0;
class CreateLicenseDto {
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
