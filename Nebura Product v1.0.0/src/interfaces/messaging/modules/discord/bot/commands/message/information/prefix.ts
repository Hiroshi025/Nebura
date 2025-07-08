import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder
} from "discord.js";

import { Precommand } from "@typings/modules/discord";

const commandPrefix: Precommand = {
  name: "prefix",
  description: "Shows the current prefix configured for this server",
  examples: ["prefix", "/prefix"],
  nsfw: false,
  owner: false,
  aliases: ["getprefix", "currentprefix"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(_client, message, _args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    const embed = new EmbedBuilder()
      .setTitle("Server Prefix")
      .setColor(0x5865f2)
      .setDescription(
        [
          `The current prefix for this server is: **\`${prefix}\`**`,
          "",
          `Use \`${prefix}help\` to see all available commands.`,
          `You can mention the bot as a prefix as well.`,
        ].join("\n"),
      )
      .setFooter({
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("copy_prefix")
        .setLabel("Copy Prefix")
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
        content: `Prefix: \`${prefix}\``,
        flags: "Ephemeral"
      });
    });

    collector.on("end", () => {
      sent.edit({ components: [] }).catch(() => {});
    });
  },
};

export = commandPrefix;
