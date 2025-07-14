import { LicenseType } from "@prisma/client";

/**
 * Data Transfer Object for creating a new license.
 *
 * @property key - Unique license key.
 * @property type - Type of license (see {@link LicenseType}).
 * @property userId - ID of the user who owns the license.
 * @property adminId - ID of the admin assigning the license.
 * @property hwid - Array of hardware IDs associated with the license.
 * @property requestLimit - Optional maximum number of allowed requests.
 * @property validUntil - Expiration date of the license.
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/enums
 */
export class CreateLicenseDto {
  key!: string;
  type!: LicenseType;
  userId!: string;
  adminId!: string;
  hwid!: string[];
  requestLimit?: number;
  validUntil!: Date;
}

/**
 * Data Transfer Object for updating an existing license.
 *
 * @property hwid - Optional array of hardware IDs to update.
 * @property requestLimit - Optional new request limit.
 * @property validUntil - Optional new expiration date.
 */
export class UpdateLicenseDto {
  hwid?: string[];
  requestLimit?: number;
  validUntil?: Date;
}
