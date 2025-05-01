import axios from "axios";
import { APIEmbed, ColorResolvable, EmbedField } from "discord.js";

import { config } from "../utils/config";

export class Notification {
  private data: typeof config.moderation.notifications;
  constructor() {
    this.data = config.moderation.notifications;
  }

  public async sendWebhookNotification(
    title: string,
    description: string,
    color: ColorResolvable,
    fields?: EmbedField[],
    options?: {
      content?: string;
      username?: string;
      avatarURL?: string;
      timestamp?: boolean;
      footer?: { text: string; iconURL?: string };
      timeout?: number; // Nuevo: tiempo de espera configurable
    },
  ) {
    try {
      // Validación básica de parámetros
      if (!title || !description) {
        throw new Error("Title and description are required");
      }

      if (typeof color !== "string" && !Array.isArray(color) && typeof color !== "number") {
        throw new Error("Invalid color format");
      }

      // Configuración por defecto
      const defaultOptions = {
        content: "🔔 Notification Alert",
        username: "API Notifications",
        avatarURL: this.data.webhooks.avatarURL,
        timestamp: true,
        timeout: 5000, // Timeout por defecto
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Construir el embed
      const embed: APIEmbed = {
        title,
        description,
        color:
          typeof color === "string"
            ? parseInt(color.replace("#", ""), 16)
            : Array.isArray(color)
              ? (color[0] << 16) + (color[1] << 8) + color[2]
              : color,
        fields: fields ?? [],
        timestamp: mergedOptions.timestamp ? new Date().toISOString() : undefined,
      };

      if (mergedOptions.footer) {
        embed.footer = mergedOptions.footer;
      }

      // Enviar la solicitud
      const response = await axios({
        baseURL: `${this.data.urlapi}/${this.data.version}`,
        url: `/webhooks/${this.data.webhooks.id}/${this.data.webhooks.token}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${config.modules.discord.token}`,
        },
        data: {
          content: mergedOptions.content,
          username: mergedOptions.username,
          avatar_url: mergedOptions.avatarURL,
          tts: false,
          embeds: [embed],
        },
        timeout: mergedOptions.timeout, // Usar timeout configurable
      });

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        return {
          status: false,
          message: `Failed to send webhook notification: ${errorMessage}`,
          error: error.response?.data ?? error.message,
        };
      }

      return {
        status: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
