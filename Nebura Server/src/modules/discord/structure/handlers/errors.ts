import { EmbedBuilder, WebhookClient } from "discord.js";
import { inspect } from "util";

import { main } from "@/main";
import { config } from "@/shared/utils/config";

import { MyClient } from "../client";

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

  // Initialize a Discord webhook client for sending error logs.
  const webhook = new WebhookClient({
    url: data.webhookURL,
  });

  // Create a reusable embed template for error messages.
  const embed = new EmbedBuilder().setColor("Red");

  /**
   * Handles Discord client errors.
   * Logs the error to the console and sends an embed to the configured webhook.
   */
  client.on("error", (err: Error) => {
    console.log(err);

    embed
      .setTitle("Discord API Error")
      .setURL("https://discordjs.guide/popular-topics/errors.html#api-errors")
      .setDescription(`\`\`\`${inspect(err, { depth: 0 }).slice(0, 1000)}\`\`\``)
      .setTimestamp();

    webhook.send({ embeds: [embed.toJSON()] }).catch(console.error);
  });

  /**
   * Handles unhandled promise rejections.
   * Logs the rejection reason and promise to the console and sends an embed to the webhook.
   */
  process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
    console.log(reason, "\n", promise);

    embed
      .setTitle("Unhandled Rejection/Catch")
      .setURL("https://nodejs.org/api/process.html#event-unhandledrejection")
      .addFields(
        { name: "Reason", value: `\`\`\`${inspect(reason, { depth: 0 }).slice(0, 1000)}\`\`\`` },
        { name: "Promise", value: `\`\`\`${inspect(promise, { depth: 0 }).slice(0, 1000)}\`\`\`` },
      )
      .setTimestamp();

    webhook.send({ embeds: [embed] }).catch(console.error);
  });

  /**
   * Handles uncaught exceptions.
   * Logs the error and origin to the console and sends an embed to the webhook.
   */
  process.on("uncaughtException", (err: Error, origin: string) => {
    console.log(err, "\n", origin);

    embed
      .setTitle("Uncaught Exception/Catch")
      .setURL("https://nodejs.org/api/process.html#event-uncaughtexception")
      .addFields(
        { name: "Error", value: `\`\`\`${inspect(err, { depth: 0 }).slice(0, 1000)}\`\`\`` },
        { name: "Origin", value: `\`\`\`${inspect(origin, { depth: 0 }).slice(0, 1000)}\`\`\`` },
      )
      .setTimestamp();

    webhook.send({ embeds: [embed] }).catch(console.error);
  });

  /**
   * Monitors uncaught exceptions.
   * Logs the error and origin to the console and sends an embed to the webhook.
   */
  process.on("uncaughtExceptionMonitor", (err: Error, origin: string) => {
    console.log(err, "\n", origin);

    embed
      .setTitle("Uncaught Exception Monitor")
      .setURL("https://nodejs.org/api/process.html#event-uncaughtexceptionmonitor")
      .addFields(
        { name: "Error", value: `\`\`\`${inspect(err, { depth: 0 }).slice(0, 1000)}\`\`\`` },
        { name: "Origin", value: `\`\`\`${inspect(origin, { depth: 0 }).slice(0, 1000)}\`\`\`` },
      )
      .setTimestamp();

    webhook.send({ embeds: [embed] }).catch(console.error);
  });

  /**
   * Handles process warnings.
   * Logs the warning to the console and sends an embed to the webhook.
   */
  process.on("warning", (warn: Error) => {
    console.log(warn);

    embed
      .setTitle("Uncaught Exception Monitor Warning")
      .setURL("https://nodejs.org/api/process.html#event-warning")
      .addFields({
        name: "Warning",
        value: `\`\`\`${inspect(warn.message, { depth: 0 }).slice(0, 1000)}\`\`\``,
      })
      .setTimestamp();

    webhook.send({ embeds: [embed] }).catch(console.error);
  });
}
