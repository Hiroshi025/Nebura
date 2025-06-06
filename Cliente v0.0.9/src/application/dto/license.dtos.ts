import { LicenseType } from "@prisma/client";

export class CreateLicenseDto {
  type!: LicenseType;
  userId!: string;
  adminId!: string;
  hwid!: string[];
  requestLimit?: number;
  validUntil!: Date;
}

export class UpdateLicenseDto {
  hwid?: string[];
  requestLimit?: number;
  validUntil?: Date;
}