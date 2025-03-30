import { Request, Response } from "express";

import { LicenseService } from "@/server/domain/services/license.service";

import { CreateLicenseDto, UpdateLicenseDto } from "../dto/license.dtos";

export class LicenseController {
  private service = new LicenseService();

  async create(req: Request, res: Response) {
    try {
      const dto: CreateLicenseDto = req.body;
      const license = await this.service.create(dto);
      res.status(201).json(license);
    } catch (error) {
      res.status(500).json({ error: "Failed to create license" });
    }
  }

  async getAll(_req: Request, res: Response) {
    try {
      const licenses = await this.service.findAll();
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch licenses" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const license = await this.service.findById(req.params.id);
      license ? res.json(license) : res.status(404).json({ error: "License not found" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch license" });
    }
  }

  async getByUser(req: Request, res: Response) {
    try {
      const licenses = await this.service.findByUserId(req.params.userId);
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user licenses" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const dto: UpdateLicenseDto = req.body;
      const license = await this.service.update(req.params.id, dto);
      res.json(license);
    } catch (error) {
      res.status(500).json({ error: "Failed to update license" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete license" });
    }
  }

  async validate(req: Request, res: Response) {
    try {
      const isValid = await this.service.validateLicense(req.params.key, req.body.hwid);
      isValid ? res.json({ valid: true }) : res.status(403).json({ valid: false });
    } catch (error) {
      res.status(500).json({ error: "License validation failed" });
    }
  }
}
