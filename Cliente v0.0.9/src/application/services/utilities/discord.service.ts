import axios from "axios";
import { load } from "cheerio";

// src/services/discord.service.ts
import { DiscordStatusResponseDTO } from "@/application/dto/discord.dtos";
import { DiscordStatusEntity, DiscordUpdateEntity } from "@/application/entities/discord.entity";

/**
 * Service for interacting with Discord's status and blog APIs.
 *
 * Provides methods to fetch the current status, latest updates, and active incidents from Discord.
 *
 * @see {@link https://discordstatus.com/} Discord Status Page
 * @see {@link https://discord.com/blog} Discord Blog
 */
export class DiscordService {
  /**
   * The base URL for the Discord status API.
   *
   * @see {@link https://discordstatus.com/api}
   * @private
   * @readonly
   */
  private readonly STATUS_API_URL = process.env.STATUS_API_URL as string;

  /**
   * The URL for the Discord blog.
   *
   * @see {@link https://discord.com/blog}
   * @private
   * @readonly
   */
  private readonly BLOG_URL = process.env.BLOG_URL as string;

  /**
   * The base URL for the Discord status page.
   *
   * @see {@link https://discordstatus.com/}
   * @private
   * @readonly
   */
  private readonly STATUS_PAGE_URL = process.env.STATUS_PAGE_URL as string;

  /**
   * Fetches the current status of Discord from the status API.
   *
   * @returns {Promise<DiscordStatusEntity>} The current status entity.
   * @throws Will return a default critical status entity if the request fails.
   *
   * @see {@link https://discordstatus.com/api/v2/status.json}
   */
  public async getCurrentStatus(): Promise<DiscordStatusEntity> {
    try {
      const response = await axios.get<DiscordStatusResponseDTO>(this.STATUS_API_URL);

      return new DiscordStatusEntity(
        response.data.status.indicator as any,
        response.data.status.description,
        new Date(response.data.page.updated_at),
      );
    } catch (error) {
      console.error("Error fetching Discord status:", error);
      return new DiscordStatusEntity("critical", "Failed to fetch status", new Date());
    }
  }

  /**
   * Fetches the latest updates from the Discord blog.
   *
   * Parses the blog HTML to extract articles, including announcements, incidents, and general updates.
   *
   * @returns {Promise<DiscordUpdateEntity[]>} An array of update entities sorted by date (descending).
   * @throws Will return an empty array if the request or parsing fails.
   *
   * @see {@link https://discord.com/blog}
   */
  public async getLatestUpdates(): Promise<DiscordUpdateEntity[]> {
    try {
      const response = await axios.get(this.BLOG_URL);
      const $ = load(response.data);
      const updates: DiscordUpdateEntity[] = [];

      $("article.post").each((_i, element) => {
        const title = $(element).find("h2").text().trim();
        const description = $(element).find("p").first().text().trim();
        const url = $(element).find("a").attr("href") || "";
        const dateStr = $(element).find("time").attr("datetime") || "";
        const tag = $(element).find(".post-tag").text().trim().toLowerCase();

        const type = tag.includes("announce")
          ? "announcement"
          : tag.includes("incident")
            ? "incident"
            : "update";

        if (title && description) {
          updates.push(
            new DiscordUpdateEntity(
              title,
              description,
              url.startsWith("http") ? url : `https://discord.com${url}`,
              new Date(dateStr),
              type,
            ),
          );
        }
      });

      return updates.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error("Error fetching Discord updates:", error);
      return [];
    }
  }

  /**
   * Fetches currently active incidents from the Discord status page.
   *
   * Only incidents that are not resolved are returned.
   *
   * @returns {Promise<DiscordUpdateEntity[]>} An array of active incident entities.
   * @throws Will return an empty array if the request fails.
   *
   * @see {@link https://discordstatus.com/api/v2/incidents.json}
   */
  public async getActiveIncidents(): Promise<DiscordUpdateEntity[]> {
    try {
      const response = await axios.get(`${this.STATUS_PAGE_URL}/api/v2/incidents.json`);
      const incidents = response.data.incidents.filter((i: any) => i.status !== "resolved");

      return incidents.map(
        (incident: any) =>
          new DiscordUpdateEntity(
            incident.name,
            incident.incident_updates[0]?.description || "No description",
            `${this.STATUS_PAGE_URL}/incidents/${incident.id}`,
            new Date(incident.created_at),
            "incident",
          ),
      );
    } catch (error) {
      console.error("Error fetching Discord incidents:", error);
      return [];
    }
  }
}
