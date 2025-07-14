// src/entities/discord.entity.ts

/**
 * Represents the current status of Discord services.
 *
 * @property indicator - Severity level of the status ('none', 'minor', 'major', 'critical')
 * @property description - Human-readable description of the status
 * @property lastUpdated - Date and time when the status was last updated
 *
 * @see {@link https://discordstatus.com/ Discord Status}
 */
export class DiscordStatusEntity {
  constructor(
    public readonly indicator: "none" | "minor" | "major" | "critical",
    public readonly description: string,
    public readonly lastUpdated: Date,
  ) {}
}

/**
 * Represents an update or announcement from Discord.
 *
 * @property title - Title of the update or announcement
 * @property description - Detailed description of the update
 * @property url - URL to the full update or announcement
 * @property date - Date and time of the update
 * @property type - Type of update ('update', 'announcement', or 'incident')
 *
 * @see {@link https://discordstatus.com/ Discord Status}
 */
export class DiscordUpdateEntity {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly url: string,
    public readonly date: Date,
    public readonly type: "update" | "announcement" | "incident",
  ) {}
}
