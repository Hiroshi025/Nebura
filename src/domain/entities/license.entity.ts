import { LicenseType } from "@prisma/client";

/**
 * Entity representing a software license.
 *
 * This class is used to encapsulate all license-related data and logic.
 * It is typically used as a domain entity in the application.
 *
 * @property id - Unique identifier for the license
 * @property type - Type of license (see {@link LicenseType})
 * @property userId - ID of the user who owns the license
 * @property adminId - ID of the admin who issued the license
 * @property hwid - Array of hardware IDs associated with the license
 * @property requestLimit - Maximum number of allowed requests (default: 1000)
 * @property requestCount - Current number of requests made (default: 0)
 * @property validUntil - Expiration date of the license
 * @property createdAt - Date when the license was created
 * @property updatedAt - Date when the license was last updated
 *
 * @see {@link https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#enum Prisma Enums}
 */
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

  /**
   * Constructs a new LicenseEntity.
   *
   * @param partial - Partial object to initialize the entity properties
   */
  constructor(partial?: Partial<LicenseEntity>) {
    Object.assign(this, partial);
  }
}
