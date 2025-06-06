import { Request, Response } from "express";

// src/controllers/discord.controller.ts
import { DiscordService } from "@/application/services/utilities/discord.service";

import {
	DiscordStatusOutputDTO, DiscordUpdateOutputDTO
} from "../../../../application/dto/discord.dtos";

/**
 * Controller for handling Discord status, updates, and incidents endpoints.
 *
 * Provides methods to fetch the current Discord status, recent updates, and incidents,
 * both for HTTP endpoints and for internal use.
 *
 * @remarks
 * This controller interacts with the DiscordService to retrieve data from Discord's status API.
 *
 * @example
 * const controller = new DiscordController();
 * app.get('/discord/status', controller.getStatus);
 */
export class DiscordController {
  /**
   * Instance of DiscordService used to fetch Discord status and updates.
   * @private
   */
  private discordService = new DiscordService();

  /**
   * Express route handler to get the current Discord status.
   *
   * Responds with a JSON object containing the mapped status, message, and last update timestamp.
   * Handles errors by returning a localized error message.
   *
   * @param req - Express Request object, extended with translation function.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with the current Discord status.
   */
  public getStatus = async (req: Request, res: Response) => {
    try {
      const status = await this.discordService.getCurrentStatus();

      const output: DiscordStatusOutputDTO = {
        status: this.mapStatusIndicator(status.indicator),
        message: status.description,
        lastUpdated: status.lastUpdated.toISOString(),
      };

      res.status(200).json(output);
    } catch (error) {
      res.status(500).json({ error: req.t("errors:failed_to_fetch_discord_status") });
    }
  };

  /**
   * Express route handler to get the latest Discord updates.
   *
   * Responds with a JSON array of update objects, each containing title, summary, link, date, and type.
   * Handles errors by returning a localized error message.
   *
   * @param req - Express Request object, extended with translation function.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with the latest Discord updates.
   */
  public getUpdates = async (req: Request, res: Response) => {
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
      res.status(500).json({ error: req.t("errors:failed_to_fetch_discord_updates") });
    }
  };

  /**
   * Express route handler to get the current active Discord incidents.
   *
   * Responds with a JSON array of incident objects, each containing title, summary, link, date, and type.
   * Handles errors by returning a localized error message.
   *
   * @param req - Express Request object, extended with translation function.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with the current Discord incidents.
   */
  public getIncidents = async (req: Request, res: Response) => {
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
      res.status(500).json({ error: req.t("errors:failed_to_fetch_discord_incidents") });
    }
  };

  /**
   * Retrieves the most recent Discord status for internal use.
   *
   * @returns {Promise<DiscordStatusOutputDTO>} The current Discord status object.
   */
  public getRecentStatus = async (): Promise<DiscordStatusOutputDTO> => {
    const status = await this.discordService.getCurrentStatus();
    return {
      status: this.mapStatusIndicator(status.indicator),
      message: status.description,
      lastUpdated: status.lastUpdated.toISOString(),
    };
  };

  /**
   * Retrieves the most recent Discord updates from the last 24 hours for internal use.
   *
   * @returns {Promise<DiscordUpdateOutputDTO[]>} Array of recent update objects.
   */
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

  /**
   * Retrieves the most recent Discord incidents from the last 24 hours for internal use.
   *
   * @returns {Promise<DiscordUpdateOutputDTO[]>} Array of recent incident objects.
   */
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

  /**
   * Maps a Discord status indicator string to a standardized status value.
   *
   * @param indicator - The status indicator from Discord ("none", "minor", "major", "critical").
   * @returns {"operational" | "degraded" | "outage"} The mapped status value.
   */
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
