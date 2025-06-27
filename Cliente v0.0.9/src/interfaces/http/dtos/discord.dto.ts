// src/dtos/discord.dto.ts
export interface DiscordStatusResponseDTO {
  status: {
    indicator: string;
    description: string;
  };
  page: {
    updated_at: string;
  };
}

export interface DiscordUpdateDTO {
  title: string;
  content: string;
  url: string;
  published_at: string;
  tag: string;
}

export interface DiscordStatusOutputDTO {
  status: 'operational' | 'degraded' | 'outage';
  message: string;
  lastUpdated: string;
}

export interface DiscordUpdateOutputDTO {
  title: string;
  summary: string;
  link: string;
  date: string;
  type: 'update' | 'announcement' | 'incident';
}