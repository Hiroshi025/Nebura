import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ModalBuilder,
	SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder, TextInputBuilder
} from "discord.js";

import { main } from "@/main";
import { Command } from "@/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";

export default new Command(
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("configuration the functions of the discord bot"),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !client.user) return;
    const data = await main.prisma.myDiscord.findUnique({ where: { clientId: client.user.id } });
    if (!data)
      return interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Configuration")
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} **Error**`,
                `No configuration found for this server.`,
              ].join("\n"),
            ),
        ],
      });

    const embed = new EmbedCorrect()
      .setTitle("Configuration")
      .setDescription(
        [
          `${client.getEmoji(interaction.guild.id, "correct")} **Configuration**`,
          `To configure, select one of the following options:`,
        ].join("\n"),
      );

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Set Webhook")
        .setCustomId("buttton:set-webhook-config")
        .setStyle(ButtonStyle.Primary),
    );

    const menus = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("menu:config-panel")
        .setPlaceholder("Select a configuration option")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Enabled Log Errors")
            .setValue("log-errors")
            .setEmoji(
              data.errorlog
                ? client.getEmoji(interaction.guild.id, "correct")
                : client.getEmoji(interaction.guild.id, "error"),
            )
            .setDescription("Enable or disable error logging"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Enabled Log Debug")
            .setValue("log-debug")
            .setEmoji(
              data.logconsole
                ? client.getEmoji(interaction.guild.id, "correct")
                : client.getEmoji(interaction.guild.id, "error"),
            )
            .setDescription("Enable or disable debug logging"),
        ),
    );

    const message = await interaction.reply({
      embeds: [embed],
      components: [menus, buttons],
      flags: "Ephemeral",
    });

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000,
    });

    collector.on("collect", async (i: ButtonInteraction | StringSelectMenuInteraction) => {
      switch (i.customId) {
        case "button:set-webhook-config":
          {
            if (!interaction.guild || !interaction.channel) return;
            const a = new TextInputBuilder()
              .setCustomId("input:webhook-url")
              .setLabel("Webhook URL")
              .setStyle(1)
              .setPlaceholder("Enter the webhook URL")
              .setRequired(true)
              .setMinLength(10)
              .setMaxLength(2000);

            const b = new ActionRowBuilder<TextInputBuilder>().addComponents(a);
            const c = new ModalBuilder()
              .setCustomId("modal:webhook-config")
              .setTitle("Webhook Configuration")
              .addComponents(b);

            await interaction.showModal(c);
          }
          break;
        case "menu:config-panel":
          {
            if (i.isStringSelectMenu() && i.values.includes("log-errors")) {
              if (!interaction.guild || !interaction.channel || !interaction.member) return;

              const data = await main.prisma.myDiscord.findUnique({
                where: { clientId: interaction.guild.id },
              });
              if (!data) return;
              const newValue = !data.errorlog;
              await main.prisma.myDiscord.update({
                where: { clientId: interaction.guild.id },
                data: { errorlog: newValue },
              });
              await i.update({
                embeds: [
                  new EmbedCorrect()
                    .setTitle("Configuration")
                    .setDescription(
                      `${client.getEmoji(interaction.guild.id, "correct")} **Configuration**\n` +
                        `The error log has been ${newValue ? "enabled" : "disabled"}.`,
                    ),
                ],
              });
            } else if (i.isStringSelectMenu() && i.values.includes("log-debug")) {
              if (!interaction.guild || !interaction.channel || !interaction.member) return;

              const data = await main.prisma.myDiscord.findUnique({
                where: { clientId: interaction.guild.id },
              });
              if (!data) return;
              const newValue = !data.logconsole;
              await main.prisma.myDiscord.update({
                where: { clientId: interaction.guild.id },
                data: { logconsole: newValue },
              });
              await i.update({
                embeds: [
                  new EmbedCorrect()
                    .setTitle("Configuration")
                    .setDescription(
                      `${client.getEmoji(interaction.guild.id, "correct")} **Configuration**\n` +
                        `The debug log has been ${newValue ? "enabled" : "disabled"}.`,
                    ),
                ],
              });
            }
          }
          break;
      }
    });

    collector.on("end", async () => {
      await interaction.editReply({
        components: [],
      });
    });

    return message;
  },
);
