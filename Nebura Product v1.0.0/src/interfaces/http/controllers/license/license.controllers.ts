import { Request, Response } from "express";

import { CreateLicenseDto, UpdateLicenseDto } from "@/application/dto/license.dto";
import { LicenseService } from "@services/license/license.service";

export class LicenseController extends LicenseService {
  constructor() {
    super();
  }

  /**
   *
   * Creates a new license.
   * @param req - The request object containing the license data.
   * @param res - The response object to send the result.
   * @returns {Promise<void>} - A promise that resolves when the license is created.
   * @throws {Error} - Throws an error if the license creation fails.
   *
   */
  async create(req: Request, res: Response) {
    console.debug("[LicenseController][create] Incoming request body:", req.body);
    try {
      const dto: CreateLicenseDto = req.body;
      console.debug("[LicenseController][create] DTO prepared:", dto);
      const license = await this.createLicense(dto);
      console.debug("[LicenseController][create] License created:", license);
      res.status(201).json(license);
    } catch (error) {
      console.debug("[LicenseController][create] Error:", error);
      res.status(500).json({ error: req.t("errors:failed_to_create_license") });
    }
  }

  /**
   *
   * Retrieves all licenses.
   * @param req - The request object.
   * @param res - The response object to send the result.
   * @returns {Promise<void>} - A promise that resolves when the licenses are retrieved.
   * @throws {Error} - Throws an error if the retrieval fails.
   *
   */
  async getAll(req: Request, res: Response) {
    console.debug("[LicenseController][getAll] Fetching all licenses");
    try {
      const licenses = await this.findAllLicense();
      console.debug("[LicenseController][getAll] Licenses fetched:", licenses);
      res.json(licenses);
    } catch (error) {
      console.debug("[LicenseController][getAll] Error:", error);
      res.status(500).json({ error: req.t("errors:failed_to_fetch_licenses") });
    }
  }

  /**
   *
   * Retrieves a license by its ID.
   * @param req - The request object containing the license ID.
   * @param res - The response object to send the result.
   * @returns {Promise<void>} - A promise that resolves when the license is retrieved.
   * @throws {Error} - Throws an error if the retrieval fails.
   *
   */
  async getById(req: Request, res: Response) {
    console.debug("[LicenseController][getById] Fetching license by ID:", req.params.id);
    try {
      const license = await this.findByIdLicense(req.params.id);
      console.debug("[LicenseController][getById] License fetched:", license);
      license ? res.json(license) : res.status(404).json({ error: req.t("errors:license_not_found") });
    } catch (error) {
      console.debug("[LicenseController][getById] Error:", error);
      res.status(500).json({ error: req.t("errors:failed_to_fetch_license") });
    }
  }

  /**
   *
   * Retrieves a license by its key.
   * @param req - The request object containing the license key.
   * @param res - The response object to send the result.
   * @returns {Promise<void>} - A promise that resolves when the license is retrieved.
   * @throws {Error} - Throws an error if the retrieval fails.
   *
   */
  async getByUser(req: Request, res: Response) {
    console.debug("[LicenseController][getByUser] Fetching licenses by userId:", req.params.userId);
    try {
      const licenses = await this.findByUserIdLicense(req.params.userId);
      console.debug("[LicenseController][getByUser] Licenses fetched:", licenses);
      res.json(licenses);
    } catch (error) {
      console.debug("[LicenseController][getByUser] Error:", error);
      res.status(500).json({ error: req.t("errors:failed_to_fetch_user_licenses") });
    }
  }

  /**
   *
   * Updates a license by its ID.
   * @param req - The request object containing the license ID and update data.
   * @param res - The response object to send the result.
   * @returns {Promise<void>} - A promise that resolves when the license is updated.
   * @throws {Error} - Throws an error if the update fails.
   *
   */
  async update(req: Request, res: Response) {
    console.debug("[LicenseController][update] Updating license ID:", req.params.id, "with body:", req.body);
    try {
      const dto: UpdateLicenseDto = req.body;
      console.debug("[LicenseController][update] DTO prepared:", dto);
      const license = await this.updateLicense(req.params.id, dto);
      console.debug("[LicenseController][update] License updated:", license);
      res.json(license);
    } catch (error) {
      console.debug("[LicenseController][update] Error:", error);
      res.status(500).json({ error: req.t("errors:failed_to_update_license") });
    }
  }

  /**
   *
   * Deletes a license by its ID.
   * @param req - The request object containing the license ID.
   * @param res - The response object to send the result.
   * @returns {Promise<void>} - A promise that resolves when the license is deleted.
   * @throws {Error} - Throws an error if the deletion fails.
   *
   */
  async delete(req: Request, res: Response) {
    console.debug("[LicenseController][delete] Deleting license ID:", req.params.id);
    try {
      await this.deleteLicense(req.params.id);
      console.debug("[LicenseController][delete] License deleted");
      res.status(204).send();
    } catch (error) {
      console.debug("[LicenseController][delete] Error:", error);
      res.status(500).json({ error: req.t("errors:failed_to_delete_license") });
    }
  }

  /**
   *
   * Validates a license key and hardware ID.
   * @param req - The request object containing the license key and hardware ID.
   * @param res - The response object to send the result.
   * @returns {Promise<void>} - A promise that resolves when the validation is complete.
   * @throws {Error} - Throws an error if the validation fails.
   *
   */
  async validate(req: Request, res: Response) {
    console.debug("[LicenseController][validate] Validating license key:", req.params.key, "with HWID:", req.body.hwid);
    try {
      const isValid = await this.validateLicense(req.params.key, req.body.hwid);
      console.debug("[LicenseController][validate] Validation result:", isValid);
      isValid
        ? res.status(200).json({ valid: true })
        : res.status(403).json({ valid: false, error: req.t("errors:license_validation_failed") });
    } catch (error) {
      console.debug("[LicenseController][validate] Error:", error);
      res.status(500).json({ error: "License validation failed" });
    }
  }
}
