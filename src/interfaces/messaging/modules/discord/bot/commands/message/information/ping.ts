import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType, EmbedBuilder
} from "discord.js";

import { Precommand } from "@typings/modules/discord";

const commandPing: Precommand = {
  name: "ping",
  nameLocalizations: {
    "es-ES": "ping",
    "en-US": "ping",
  },
  description: "Shows the bot and Discord API latency",
  descriptionLocalizations: {
    "es-ES": "Muestra la latencia del bot y de la API de Discord",
    "en-US": "Shows the bot and Discord API latency",
  },
  examples: ["ping", "pong"],
  nsfw: false,
  category: "Information",
  owner: false,
  aliases: ["pong", "latency"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    const t = client.translations.getFixedT(message.guild.preferredLocale || "es-ES", "discord");

    const sent = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏓 " + t("ping.title"))
          .setDescription(t("ping.calculating"))
          .setColor(0x5865f2),
      ],
    });

    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
      .setTitle("🏓 " + t("ping.title"))
      .setColor(0x5865f2)
      .addFields(
        { name: t("ping.botLatency"), value: `\`${latency}ms\``, inline: true },
        { name: t("ping.apiLatency"), value: `\`${apiLatency}ms\``, inline: true },
      )
      .setFooter({ text: t("ping.refreshFooter") });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("refresh_ping")
        .setLabel(t("ping.refresh"))
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
          .setTitle("🏓 " + t("ping.title"))
          .setColor(0x5865f2)
          .addFields(
            { name: t("ping.botLatency"), value: `\`${newLatency}ms\``, inline: true },
            { name: t("ping.apiLatency"), value: `\`${newApiLatency}ms\``, inline: true },
          )
          .setFooter({ text: t("ping.refreshFooter") });

        await interaction.editReply({ embeds: [refreshedEmbed], components: [buttons] });
      }
    });

    collector.on("end", () => {
      sent.edit({ components: [] }).catch(() => {});
    });
  },
};

export default commandPing;
