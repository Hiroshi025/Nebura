import { Request, Response } from "express";

// src/controllers/discord.controller.ts
import { DiscordService } from "@/server/domain/services/utilities/discord.service";

import { DiscordStatusOutputDTO, DiscordUpdateOutputDTO } from "../../dto/discord.dtos";

export class DiscordController {
  private discordService = new DiscordService();

  public getStatus = async (_req: Request, res: Response) => {
    try {
      const status = await this.discordService.getCurrentStatus();

      const output: DiscordStatusOutputDTO = {
        status: this.mapStatusIndicator(status.indicator),
        message: status.description,
        lastUpdated: status.lastUpdated.toISOString(),
      };

      res.status(200).json(output);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Discord status" });
    }
  };

  public getUpdates = async (_req: Request, res: Response) => {
    try {
      const updates = await this.discordService.getLatestUpdates();

      const output: DiscordUpdateOutputDTO[] = updates.map((update) => ({
        title: update.title,
        summary: update.description,
        link: update.url,
        date: update.date.toISOString(),
        type: update.type,
      }));

      res.status(200).json(output);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Discord updates" });
    }
  };

  public getIncidents = async (_req: Request, res: Response) => {
    try {
      const incidents = await this.discordService.getActiveIncidents();

      const output: DiscordUpdateOutputDTO[] = incidents.map((incident) => ({
        title: incident.title,
        summary: incident.description,
        link: incident.url,
        date: incident.date.toISOString(),
        type: "incident",
      }));

      res.status(200).json(output);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Discord incidents" });
    }
  };

  public getRecentStatus = async (): Promise<DiscordStatusOutputDTO> => {
    const status = await this.discordService.getCurrentStatus();
    return {
      status: this.mapStatusIndicator(status.indicator),
      message: status.description,
      lastUpdated: status.lastUpdated.toISOString(),
    };
  };

  public getRecentUpdates = async (): Promise<DiscordUpdateOutputDTO[]> => {
    const updates = await this.discordService.getLatestUpdates();
    const recentUpdates = updates.filter((update) => {
      const now = new Date();
      const diff = now.getTime() - update.date.getTime();
      return diff <= 24 * 60 * 60 * 1000; // Últimas 24 horas
    });
    return recentUpdates.map((update) => ({
      title: update.title,
      summary: update.description,
      link: update.url,
      date: update.date.toISOString(),
      type: update.type,
    }));
  };

  public getRecentIncidents = async (): Promise<DiscordUpdateOutputDTO[]> => {
    const incidents = await this.discordService.getActiveIncidents();
    const recentIncidents = incidents.filter((incident) => {
      const now = new Date();
      const diff = now.getTime() - incident.date.getTime();
      return diff <= 24 * 60 * 60 * 1000; // Últimas 24 horas
    });
    return recentIncidents.map((incident) => ({
      title: incident.title,
      summary: incident.description,
      link: incident.url,
      date: incident.date.toISOString(),
      type: "incident",
    }));
  };

  private mapStatusIndicator(indicator: string): DiscordStatusOutputDTO["status"] {
    switch (indicator) {
      case "none":
        return "operational";
      case "minor":
        return "degraded";
      case "major":
      case "critical":
      default:
        return "outage";
    }
  }
}
