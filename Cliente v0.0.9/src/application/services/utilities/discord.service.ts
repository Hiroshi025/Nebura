// src/services/discord.service.ts
import axios from "axios";
import { load } from "cheerio";

import { DiscordStatusResponseDTO } from "@/application/dto/discord.dtos";

import { DiscordStatusEntity, DiscordUpdateEntity } from "../../entitys/discord.entity";

export class DiscordService {
  private readonly STATUS_API_URL = process.env.STATUS_API_URL as string;
  private readonly BLOG_URL = process.env.BLOG_URL as string;
  private readonly STATUS_PAGE_URL = process.env.STATUS_PAGE_URL as string;

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
