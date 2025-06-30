import { UpdateLicenseDto } from "@/interfaces/http/dtos/license.dto";
import { LicenseDataToCreate } from "@typings/modules/api";

/**
 * Interface for the License Repository Port.
 *
 * @remarks
 * This interface defines the contract for license-related persistence operations,
 * including creation, retrieval, updating, and deletion of license records.
 * Implementations should handle the data access logic for license entities.
 *
 * @see {@link https://en.wikipedia.org/wiki/Software_license Software license - Wikipedia}
 */
export interface ILicenseRepositoryPort {
  /**
   * Retrieves all license records.
   *
   * @returns A promise that resolves to an array of license objects.
   *
   * @example
   * ```ts
   * const licenses = await licenseRepository.findMany();
   * ```
   */
  findMany(): Promise<any[]>;

  /**
   * Finds a license by its unique identifier.
   *
   * @param id - The unique identifier of the license.
   * @returns A promise that resolves to the license object if found, or `false` if not found.
   *
   * @example
   * ```ts
   * const license = await licenseRepository.findById("licenseId123");
   * ```
   */
  findById(id: string): Promise<any | false>;

  /**
   * Finds a license by its license key.
   *
   * @param key - The license key to search for.
   * @returns A promise that resolves to the license object if found, or `false` if not found.
   *
   * @example
   * ```ts
   * const license = await licenseRepository.findByKey("ABC-123-XYZ");
   * ```
   */
  findByKey(key: string): Promise<any | false>;

  /**
   * Finds all licenses associated with a specific user.
   *
   * @param userId - The unique identifier of the user.
   * @returns A promise that resolves to an array of license objects.
   *
   * @example
   * ```ts
   * const userLicenses = await licenseRepository.findByUserId("userId123");
   * ```
   */
  findByUserId(userId: string): Promise<any[]>;

  /**
   * Updates a license by its unique identifier.
   *
   * @param id - The unique identifier of the license to update.
   * @param data - The data to update the license with.
   * @returns A promise that resolves to the updated license object.
   *
   * @example
   * ```ts
   * const updated = await licenseRepository.updateLic("licenseId123", updateData);
   * ```
   */
  updateLic(id: string, data: UpdateLicenseDto): Promise<any>;

  /**
   * Deletes a license by its unique identifier.
   *
   * @param id - The unique identifier of the license to delete.
   * @returns A promise that resolves to the deleted license object if successful, or `false` if not found.
   *
   * @example
   * ```ts
   * const deleted = await licenseRepository.deleteById("licenseId123");
   * ```
   */
  deleteById(id: string): Promise<any | false>;

  /**
   * Updates a license by its unique identifier for a specific request (e.g., renewal or status change).
   *
   * @param id - The unique identifier of the license to update.
   * @returns A promise that resolves to the updated license object if successful, or `false` if not found.
   *
   * @example
   * ```ts
   * const updated = await licenseRepository.updateByIdRequest("licenseId123");
   * ```
   */
  updateByIdRequest(id: string): Promise<any | false>;

  /**
   * Creates a new license record.
   *
   * @param data - The data required to create a new license.
   * @returns A promise that resolves to the created license object.
   *
   * @example
   * ```ts
   * const newLicense = await licenseRepository.createLic(licenseData);
   * ```
   */
  createLic(data: LicenseDataToCreate): Promise<any>;
}
