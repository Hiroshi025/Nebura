import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";

import { EmbedCorrect } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const commandPrefix: Precommand = {
  name: "prefix",
  nameLocalizations: {
    "es-ES": "prefijo",
    "en-US": "prefix",
  },
  description: "Shows the current prefix configured for this server",
  descriptionLocalizations: {
    "es-ES": "Muestra el prefijo actual configurado para este servidor",
    "en-US": "Shows the current prefix configured for this server",
  },
  examples: ["prefix", "/prefix"],
  nsfw: false,
  category: "Information",
  owner: false,
  aliases: ["getprefix", "currentprefix"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message, _args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    const t = client.translations.getFixedT(message.guild.preferredLocale || "es-ES", "discord");

    const embed = new EmbedCorrect()
      .setTitle(t("prefix.title"))
      .setDescription(
        [t("prefix.current", { prefix }), "", t("prefix.help", { prefix }), t("prefix.mention")].join("\n"),
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("copy_prefix")
        .setLabel(t("prefix.copyButton"))
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📋"),
    );

    const sent = await message.reply({ embeds: [embed], components: [row] });

    const collector = sent.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id && i.customId === "copy_prefix",
      componentType: 2, // Button
      time: 30000,
    });

    collector.on("collect", async (interaction) => {
      await interaction.reply({
        content: t("prefix.copied", { prefix }),
        flags: "Ephemeral",
      });
    });

    collector.on("end", () => {
      sent.edit({ components: [] }).catch(() => {});
    });
  },
};

export default commandPrefix;
