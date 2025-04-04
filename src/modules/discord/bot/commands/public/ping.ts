import { SlashCommandBuilder } from "discord.js";

import { EmbedExtender } from "@/infrastructure/extenders/discord/embeds.extender";
import { Command } from "@/modules/discord/infrastructure/utils/builders";

export default new Command(
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Displays the bot's latency and additional information.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("An optional message to include in the response.")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("ephemeral")
        .setDescription("Whether the response should be visible only to you.")
        .setRequired(false),
    ),
  async (client, interaction) => {
    const message = interaction.options.getString("message");
    const ephemeral = interaction.options.getBoolean("ephemeral") ?? false;

    const latency = client.ws.ping;
    const embed = new EmbedExtender()
      .setError(false)
      .setTitle("🏓 Pong!")
      .setDescription("Here is the bot's latency and additional details:")
      .addFields(
        { name: "Latency", value: `${latency}ms`, inline: true },
        { name: "Message", value: message || "No message provided", inline: true },
      );

    await interaction.reply({
      embeds: [embed],
      flags: ephemeral ? "Ephemeral" : "SuppressNotifications",
    });
  },
);
