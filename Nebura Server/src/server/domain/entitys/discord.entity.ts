// src/entities/discord.entity.ts
export class DiscordStatusEntity {
  constructor(
    public readonly indicator: 'none' | 'minor' | 'major' | 'critical',
    public readonly description: string,
    public readonly lastUpdated: Date
  ) {}
}

export class DiscordUpdateEntity {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly url: string,
    public readonly date: Date,
    public readonly type: 'update' | 'announcement' | 'incident'
  ) {}
}