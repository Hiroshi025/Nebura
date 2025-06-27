import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType, EmbedBuilder
} from "discord.js";

import { Precommand } from "@typings/modules/discord";

const commandPing: Precommand = {
  name: "ping",
  description: "Shows the bot and Discord API latency",
  examples: ["ping", "pong"],
  nsfw: false,
  owner: false,
  aliases: ["pong", "latency"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    const sent = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏓 Pong!")
          .setDescription("Calculating latency...")
          .setColor(0x5865f2),
      ],
    });

    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setColor(0x5865f2)
      .addFields(
        { name: "Bot Latency", value: `\`${latency}ms\``, inline: true },
        { name: "API Latency", value: `\`${apiLatency}ms\``, inline: true },
      )
      .setFooter({ text: "Click 'Refresh' to update the latency." });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("refresh_ping")
        .setLabel("Refresh")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔄"),
    );

    await sent.edit({ embeds: [embed], components: [buttons] });

    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "refresh_ping") {
        await interaction.deferUpdate();
        const newLatency = Date.now() - message.createdTimestamp;
        const newApiLatency = Math.round(client.ws.ping);

        const refreshedEmbed = new EmbedBuilder()
          .setTitle("🏓 Pong!")
          .setColor(0x5865f2)
          .addFields(
            { name: "Bot Latency", value: `\`${newLatency}ms\``, inline: true },
            { name: "API Latency", value: `\`${newApiLatency}ms\``, inline: true },
          )
          .setFooter({ text: "Click 'Refresh' to update the latency." });

        await interaction.editReply({ embeds: [refreshedEmbed], components: [buttons] });
      }
    });

    collector.on("end", () => {
      sent.edit({ components: [] }).catch(() => {});
    });
  },
};

export = commandPing;
