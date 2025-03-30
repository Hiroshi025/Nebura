import { LicenseType } from "@prisma/client";

export class LicenseEntity {
  id!: string;
  type!: LicenseType;
  userId!: string;
  adminId!: string;
  hwid: string[] = [];
  requestLimit: number = 1000;
  requestCount: number = 0;
  validUntil!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial?: Partial<LicenseEntity>) {
    Object.assign(this, partial);
  }
}