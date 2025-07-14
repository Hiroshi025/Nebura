// src/dtos/discord.dto.ts

/**
 * DTO for the raw Discord status API response.
 *
 * @property status - Contains the indicator and description of the current status.
 * @property page - Contains the last updated timestamp.
 *
 * @see https://discordstatus.com/api
 */
export interface DiscordStatusResponseDTO {
  status: {
    indicator: string;
    description: string;
  };
  page: {
    updated_at: string;
  };
}

/**
 * DTO for a Discord update/news item from the status API.
 *
 * @property title - Title of the update.
 * @property content - Full content or body of the update.
 * @property url - URL to the update.
 * @property published_at - ISO date string when the update was published.
 * @property tag - Tag or category of the update.
 */
export interface DiscordUpdateDTO {
  title: string;
  content: string;
  url: string;
  published_at: string;
  tag: string;
}

/**
 * Output DTO for normalized Discord status information.
 *
 * @property status - Operational state ('operational', 'degraded', or 'outage').
 * @property message - Human-readable status message.
 * @property lastUpdated - ISO date string of the last update.
 */
export interface DiscordStatusOutputDTO {
  status: "operational" | "degraded" | "outage";
  message: string;
  lastUpdated: string;
}

/**
 * Output DTO for normalized Discord update/news information.
 *
 * @property title - Title of the update.
 * @property summary - Short summary or excerpt.
 * @property link - URL to the full update.
 * @property date - ISO date string of the update.
 * @property type - Type of update ('update', 'announcement', or 'incident').
 */
export interface DiscordUpdateOutputDTO {
  title: string;
  summary: string;
  link: string;
  date: string;
  type: "update" | "announcement" | "incident";
}
