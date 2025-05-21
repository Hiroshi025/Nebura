import axios from "axios";
import { APIEmbed, ColorResolvable, EmbedField } from "discord.js";
import nodemailer from "nodemailer";

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
      timeout?: number;
    },
  ) {
    try {
      // Validación básica de parámetros
      if (!title || typeof title !== "string" || title.trim().length === 0) {
        throw new Error("Title is required and must be a non-empty string");
      }
      if (!description || typeof description !== "string" || description.trim().length === 0) {
        throw new Error("Description is required and must be a non-empty string");
      }
      if (typeof color !== "string" && !Array.isArray(color) && typeof color !== "number") {
        throw new Error("Invalid color format");
      }
      if (
        !this.data?.urlapi ||
        !this.data?.version ||
        !this.data?.webhooks?.id ||
        !this.data?.webhooks?.token
      ) {
        throw new Error("Webhook configuration is missing or incomplete");
      }
      if (!config.modules?.discord?.token) {
        throw new Error("Discord bot token is missing in configuration");
      }

      // Configuración por defecto
      const defaultOptions = {
        content: "🔔 Notification Alert",
        username: "API Notifications",
        avatarURL: this.data.webhooks.avatarURL,
        timestamp: true,
        timeout: 5000,
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
        timeout: mergedOptions.timeout,
      });

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      // Manejo detallado de errores
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
        error,
      };
    }
  }

  /**
   * Send a highly customizable notification email using Gmail.
   * @param to Recipient email address.
   * @param subject Email subject.
   * @param html HTML content of the email.
   * @param options Optional nodemailer options (attachments, etc).
   * @returns Promise with status and info or error.
   */
  public async sendEmailNotification(
    to: string,
    subject: string,
    html: string,
    options?: Partial<{
      from: string;
      attachments: any[];
      text: string;
      replyTo: string;
    }>,
  ) {
    try {
      // Validaciones de parámetros
      if (!to || typeof to !== "string" || !to.includes("@")) {
        throw new Error("Recipient email address (to) is required and must be valid");
      }
      if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
        throw new Error("Subject is required and must be a non-empty string");
      }
      if (!html || typeof html !== "string" || html.trim().length === 0) {
        throw new Error("HTML content is required and must be a non-empty string");
      }
      if (!process.env.USER_EMAIL || !process.env.PASS_EMAIL) {
        throw new Error("Gmail credentials are missing in environment variables");
      }

      // Configure transporter for Gmail
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.PASS_EMAIL,
        },
      });

      const mailOptions = {
        from: options?.from || process.env.USER_EMAIL,
        to,
        subject,
        html,
        text: options?.text,
        attachments: options?.attachments,
        replyTo: options?.replyTo,
      };

      // Validar opciones de correo
      if (mailOptions.attachments && !Array.isArray(mailOptions.attachments)) {
        throw new Error("Attachments must be an array");
      }

      const info = await transporter.sendMail(mailOptions);

      return {
        status: true,
        info,
      };
    } catch (error) {
      // Manejo detallado de errores
      return {
        status: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        error,
      };
    }
  }
}
