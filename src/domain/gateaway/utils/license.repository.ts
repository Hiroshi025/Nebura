import { UpdateLicenseDto } from "@/interfaces/http/dtos/license.dto";
import { main } from "@/main";
import { ILicenseRepositoryPort } from "@domain/ports/services/license.repository.port";
import { LicenseDataToCreate } from "@typings/modules/api";

/**
 * Repository for managing license data in the database.
 * Implements {@link ILicenseRepositoryPort}.
 *
 * Uses Prisma ORM for all database operations.
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client Prisma Client}
 */
export class LicenseRepository implements ILicenseRepositoryPort {
  /**
   * Constructs a new LicenseRepository.
   */
  constructor() {}

  /**
   * Retrieves all licenses from the database.
   * @returns An array of license records.
   */
  public async findMany() {
    const data = await main.prisma.license.findMany();
    return data;
  }

  /**
   * Finds a license by its unique ID.
   * @param id - The license's unique identifier.
   * @returns The license record if found, or false if not found.
   */
  public async findById(id: string) {
    const data = await main.prisma.license.findUnique({
      where: { id },
    });
    return data ? data : false;
  }

  /**
   * Finds a license by its unique key.
   * @param key - The license key.
   * @returns The license record if found, or false if not found.
   */
  public async findByKey(key: string) {
    const data = await main.prisma.license.findUnique({
      where: { key },
    });
    return data ? data : false;
  }

  /**
   * Retrieves all licenses associated with a specific user.
   * @param userId - The user's unique identifier.
   * @returns An array of license records for the user.
   */
  public async findByUserId(userId: string) {
    const data = await main.prisma.license.findMany({
      where: { userId },
    });
    return data;
  }

  /**
   * Updates a license by its ID.
   * @param id - The license's unique identifier.
   * @param data - Data to update (see {@link UpdateLicenseDto}).
   * @returns The updated license record.
   * @throws {Error} If a database error occurs.
   */
  public async updateLic(id: string, data: UpdateLicenseDto) {
    try {
      const updatedData = await main.prisma.license.update({
        where: { id },
        data,
      });
      return updatedData;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }

  /**
   * Deletes a license by its ID.
   * @param id - The license's unique identifier.
   * @returns The deleted license record if found, or false if not found.
   * @throws {Error} If a database error occurs.
   */
  public async deleteById(id: string) {
    try {
      const data = await main.prisma.license.delete({
        where: { id },
      });
      return data ? data : false;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }

  /**
   * Increments the request count for a license by its ID.
   * @param id - The license's unique identifier.
   * @returns The updated license record if found, or false if not found.
   * @throws {Error} If a database error occurs.
   */
  public async updateByIdRequest(id: string) {
    try {
      const data = await main.prisma.license.update({
        where: { id },
        data: { requestCount: { increment: 1 } },
      });
      return data ? data : false;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }

  /**
   * Creates a new license in the database.
   * @param data - License creation data (see {@link LicenseDataToCreate}).
   * @returns The created license record.
   * @throws {Error} If a database error occurs or if validUntil is undefined.
   */
  public async createLic(data: LicenseDataToCreate) {
    try {
      if (data.validUntil === undefined) {
        throw new Error("validUntil is required and cannot be undefined");
      }
      const license = await main.prisma.license.create({
        data: {
          ...data,
          validUntil: data.validUntil as Date | string,
        },
      });
      return license;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }
}
