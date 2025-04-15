import { EmbedBuilder, WebhookClient } from "discord.js";
import { inspect } from "util";

import { main } from "@/main";
import { config } from "@/shared/utils/config";

import { MyClient } from "../client";

export async function ErrorConsole(client: MyClient) {
  const data = await main.prisma.appDiscord.findUnique({
    where: { clientId: config.modules.discord.clientId },
  });
  if (!data || data.errorlog === false || data.webhookURL === null) return;

  const webhook = new WebhookClient({
    url: data.webhookURL,
  });
  const embed = new EmbedBuilder().setColor("Red");

  client.on("error", (err: Error) => {
    console.log(err);

    embed
      .setTitle("Discord API Error")
      .setURL("https://discordjs.guide/popular-topics/errors.html#api-errors")
      .setDescription(`\`\`\`${inspect(err, { depth: 0 }).slice(0, 1000)}\`\`\``)
      .setTimestamp();

    webhook.send({ embeds: [embed] }).catch(console.error);
  });

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

  process.on("warning", (warn: Error) => {
    console.log(warn);

    embed
      .setTitle("Uncaught Exception Monitor Warning")
      .setURL("https://nodejs.org/api/process.html#event-warning")
      .addFields({
        name: "Warning",
        value: `\`\`\`${inspect(warn, { depth: 0 }).slice(0, 1000)}\`\`\``,
      })
      .setTimestamp();

    webhook.send({ embeds: [embed] }).catch(console.error);
  });
}
