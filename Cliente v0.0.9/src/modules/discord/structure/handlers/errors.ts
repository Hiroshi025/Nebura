import { EmbedBuilder, WebhookClient } from "discord.js";
import { inspect } from "util";

import { main } from "@/main";
import { config } from "@/shared/utils/config";

import { MyClient } from "../../client";

/**
 * Sets up error handling and logging for the Discord client and Node.js process.
 *
 * This function listens for various error events, logs them to the console, and sends detailed
 * error information to a Discord webhook if configured.
 *
 * @param client - The Discord client instance.
 */
export async function ErrorConsole(client: MyClient) {
  // Fetch Discord-specific configuration from the database.
  const data = await main.prisma.myDiscord.findUnique({
    where: { clientId: config.modules.discord.clientId },
  });

  // Exit if error logging is disabled or webhook URL is not provided.
  if (!data || data.errorlog === false || data.webhookURL === null) return;

  const webhook = new WebhookClient({
    url: data.webhookURL,
  });

  /**
   * Utilidad para crear un embed detallado para errores.
   */
  function createErrorEmbed({
    title,
    url,
    description,
    fields = [],
    color = 0xed4245, // rojo
    footer,
    timestamp = true,
  }: {
    title: string;
    url?: string;
    description?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    color?: number;
    footer?: string;
    timestamp?: boolean;
  }) {
    const embed = new EmbedBuilder().setTitle(title).setColor(color);

    if (url) embed.setURL(url);
    if (description) embed.setDescription(description);
    if (fields.length) embed.addFields(fields);
    if (footer) embed.setFooter({ text: footer });
    if (timestamp) embed.setTimestamp();

    return embed;
  }

  // Discord client error
  client.on("error", (err: Error) => {
    console.log(err);

    const embed = createErrorEmbed({
      title: "Discord API Error",
      url: "https://discordjs.guide/popular-topics/errors.html#api-errors",
      description: `Se ha producido un error en el cliente de Discord.`,
      fields: [
        { name: "Mensaje", value: `\`\`\`${err.message}\`\`\`` },
        {
          name: "Stacktrace",
          value: `\`\`\`${(err.stack || "Sin stacktrace").slice(0, 1000)}\`\`\``,
        },
        { name: "Nombre", value: `\`${err.name}\``, inline: true },
        { name: "Fecha", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Desconocido"}\``, inline: true },
      ],
      footer: `Nebura Platformm, Discord API Error`,
    });

    webhook.send({ embeds: [embed] }).catch(console.error);
  });

  // Unhandled promise rejection
  process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
    console.log(reason, "\n", promise);

    const embed = createErrorEmbed({
      title: "Unhandled Promise Rejection",
      url: "https://nodejs.org/api/process.html#event-unhandledrejection",
      description: "Se detectó una promesa rechazada que no fue capturada.",
      fields: [
        { name: "Razón", value: `\`\`\`${inspect(reason, { depth: 2 }).slice(0, 1000)}\`\`\`` },
        { name: "Promesa", value: `\`\`\`${inspect(promise, { depth: 0 }).slice(0, 1000)}\`\`\`` },
        { name: "Fecha", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Desconocido"}\``, inline: true },
      ],
      footer: "Node.js UnhandledRejection",
    });

    webhook.send({ embeds: [embed] }).catch(console.error);
  });

  // Uncaught exception
  process.on("uncaughtException", (err: Error, origin: string) => {
    console.log(err, "\n", origin);

    const embed = createErrorEmbed({
      title: "Uncaught Exception",
      url: "https://nodejs.org/api/process.html#event-uncaughtexception",
      description: "Se ha producido una excepción no capturada.",
      fields: [
        { name: "Error", value: `\`\`\`${err.message}\`\`\`` },
        {
          name: "Stacktrace",
          value: `\`\`\`${(err.stack || "Sin stacktrace").slice(0, 1000)}\`\`\``,
        },
        { name: "Origen", value: `\`${origin}\`` },
        { name: "Fecha", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Desconocido"}\``, inline: true },
      ],
      footer: "Node.js UncaughtException",
    });

    webhook.send({ embeds: [embed] }).catch(console.error);
  });

  // Uncaught exception monitor
  process.on("uncaughtExceptionMonitor", (err: Error, origin: string) => {
    console.log(err, "\n", origin);

    const embed = createErrorEmbed({
      title: "Uncaught Exception Monitor",
      url: "https://nodejs.org/api/process.html#event-uncaughtexceptionmonitor",
      description: "Monitor de excepciones no capturadas.",
      fields: [
        { name: "Error", value: `\`\`\`${err.message}\`\`\`` },
        {
          name: "Stacktrace",
          value: `\`\`\`${(err.stack || "Sin stacktrace").slice(0, 1000)}\`\`\``,
        },
        { name: "Origen", value: `\`${origin}\`` },
        { name: "Fecha", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Desconocido"}\``, inline: true },
      ],
      footer: "Node.js UncaughtExceptionMonitor",
    });

    webhook.send({ embeds: [embed] }).catch(console.error);
  });

  // Process warning
  process.on("warning", (warn: Error) => {
    console.log(warn);

    const embed = createErrorEmbed({
      title: "Node.js Warning",
      url: "https://nodejs.org/api/process.html#event-warning",
      description: "Advertencia del proceso Node.js.",
      fields: [
        { name: "Mensaje", value: `\`\`\`${warn.message}\`\`\`` },
        {
          name: "Stacktrace",
          value: `\`\`\`${(warn.stack || "Sin stacktrace").slice(0, 1000)}\`\`\``,
        },
        { name: "Fecha", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: "Client ID", value: `\`${client.user?.id || "Desconocido"}\``, inline: true },
      ],
      footer: "Node.js Warning",
    });

    webhook.send({ embeds: [embed] }).catch(console.error);
  });
}
