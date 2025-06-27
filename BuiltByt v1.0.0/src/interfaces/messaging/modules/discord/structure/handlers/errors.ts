import { EmbedBuilder, WebhookClient } from "discord.js";
import os from "os";
import { inspect } from "util";

import { main } from "@/main";

import { MyClient } from "../../client";

/**
 * Sets up advanced error handling and logging for the Discord client and Node.js process.
 *
 * This function listens for various error events, logs them to the console, and sends detailed
 * error information to a Discord webhook if configured. It provides rich context for debugging,
 * including process, environment, and error details.
 *
 * @param client - The Discord client instance.
 * @see {@link https://discordjs.guide/popular-topics/errors.html Discord.js Error Guide}
 * @see {@link https://nodejs.org/api/process.html Node.js Process Events}
 * @example
 * ```typescript
 * import { ErrorConsole } from "./handlers/errors";
 * ErrorConsole(client);
 * ```
 */
export async function ErrorConsole(client: MyClient) {
  // Fetch Discord-specific configuration from the database.
  const data = await main.DB.findDiscord(client.user?.id as string);

  // Exit if error logging is disabled or webhook URL is not provided.
  if (!data || data.errorlog === false || !data.webhookURL) return;

  const webhook = new WebhookClient({ url: data.webhookURL });

  /**
   * Utility to create a detailed error embed for Discord.
   * @param options - Embed options.
   * @returns {EmbedBuilder}
   */
  function createErrorEmbed({
    title,
    url,
    description,
    fields = [],
    color = 0xed4245, // Red
    footer,
    timestamp = true,
    extra = {},
  }: {
    title: string;
    url?: string;
    description?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    color?: number;
    footer?: string;
    timestamp?: boolean;
    extra?: Record<string, string>;
  }) {
    const embed = new EmbedBuilder().setTitle(title).setColor(color);

    if (url) embed.setURL(url);
    if (description) embed.setDescription(description);
    if (fields.length) embed.addFields(fields);
    if (footer) embed.setFooter({ text: footer });
    if (timestamp) embed.setTimestamp();

    // Add extra fields if provided
    for (const [key, value] of Object.entries(extra)) {
      embed.addFields({ name: key, value, inline: false });
    }

    return embed;
  }

  /**
   * Returns process and environment details for debugging.
   */
  function getProcessDetails() {
    return [
      { name: "Node.js Version", value: `\`${process.version}\``, inline: true },
      { name: "Platform", value: `\`${process.platform}\``, inline: true },
      { name: "Arch", value: `\`${process.arch}\``, inline: true },
      { name: "Process PID", value: `\`${process.pid}\``, inline: true },
      { name: "Uptime", value: `\`${process.uptime().toFixed(2)}s\``, inline: true },
      {
        name: "Memory Usage",
        value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``,
        inline: true,
      },
      { name: "Hostname", value: `\`${os.hostname()}\``, inline: true },
    ];
  }

  /**
   * Sends an error embed to the configured Discord webhook.
   * @param embed - The embed to send.
   */
  async function sendErrorEmbed(embed: EmbedBuilder) {
    try {
      await webhook.send({ embeds: [embed] });
    } catch (err) {
      // Fallback to console if webhook fails
      console.error("Failed to send error embed to Discord webhook:", err);
    }
  }

  // Discord client error
  client.on("error", (err: Error) => {
    console.error("[Discord Client Error]", err);

    const embed = createErrorEmbed({
      title: "Discord API Error",
      url: "https://discordjs.guide/popular-topics/errors.html#api-errors",
      description: `A Discord client error has occurred.`,
      fields: [
        { name: "Message", value: `\`\`\`${err.message}\`\`\`` },
        {
          name: "Stacktrace",
          value: `\`\`\`${(err.stack || "No stacktrace available").slice(0, 1000)}\`\`\``,
        },
        { name: "Name", value: `\`${err.name}\``, inline: true },
        { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Unknown"}\``, inline: true },
        ...getProcessDetails(),
      ],
      footer: "Nebura Platform - Discord API Error",
    });

    sendErrorEmbed(embed);
  });

  // Unhandled promise rejection
  process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
    console.error("[Unhandled Promise Rejection]", reason, "\nPromise:", promise);

    const embed = createErrorEmbed({
      title: "Unhandled Promise Rejection",
      url: "https://nodejs.org/api/process.html#event-unhandledrejection",
      description: "An unhandled promise rejection was detected.",
      fields: [
        { name: "Reason", value: `\`\`\`${inspect(reason, { depth: 2 }).slice(0, 1000)}\`\`\`` },
        { name: "Promise", value: `\`\`\`${inspect(promise, { depth: 0 }).slice(0, 1000)}\`\`\`` },
        { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Unknown"}\``, inline: true },
        ...getProcessDetails(),
      ],
      footer: "Node.js UnhandledRejection",
    });

    sendErrorEmbed(embed);
  });

  // Uncaught exception
  process.on("uncaughtException", (err: Error, origin: string) => {
    console.error("[Uncaught Exception]", err, "\nOrigin:", origin);

    const embed = createErrorEmbed({
      title: "Uncaught Exception",
      url: "https://nodejs.org/api/process.html#event-uncaughtexception",
      description: "An uncaught exception has occurred.",
      fields: [
        { name: "Error", value: `\`\`\`${err.message}\`\`\`` },
        {
          name: "Stacktrace",
          value: `\`\`\`${(err.stack || "No stacktrace available").slice(0, 1000)}\`\`\``,
        },
        { name: "Origin", value: `\`${origin}\`` },
        { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Unknown"}\``, inline: true },
        ...getProcessDetails(),
      ],
      footer: "Node.js UncaughtException",
    });

    sendErrorEmbed(embed);
  });

  // Uncaught exception monitor
  process.on("uncaughtExceptionMonitor", (err: Error, origin: string) => {
    console.error("[Uncaught Exception Monitor]", err, "\nOrigin:", origin);

    const embed = createErrorEmbed({
      title: "Uncaught Exception Monitor",
      url: "https://nodejs.org/api/process.html#event-uncaughtexceptionmonitor",
      description: "Monitor for uncaught exceptions.",
      fields: [
        { name: "Error", value: `\`\`\`${err.message}\`\`\`` },
        {
          name: "Stacktrace",
          value: `\`\`\`${(err.stack || "No stacktrace available").slice(0, 1000)}\`\`\``,
        },
        { name: "Origin", value: `\`${origin}\`` },
        { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Unknown"}\``, inline: true },
        ...getProcessDetails(),
      ],
      footer: "Node.js UncaughtExceptionMonitor",
    });

    sendErrorEmbed(embed);
  });

  // Process warning
  process.on("warning", (warn: Error) => {
    console.warn("[Node.js Warning]", warn);

    const embed = createErrorEmbed({
      title: "Node.js Warning",
      url: "https://nodejs.org/api/process.html#event-warning",
      description: "A Node.js process warning was emitted.",
      fields: [
        { name: "Message", value: `\`\`\`${warn.message}\`\`\`` },
        {
          name: "Stacktrace",
          value: `\`\`\`${(warn.stack || "No stacktrace available").slice(0, 1000)}\`\`\``,
        },
        { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Unknown"}\``, inline: true },
        ...getProcessDetails(),
      ],
      footer: "Node.js Warning",
    });

    sendErrorEmbed(embed);
  });
}
