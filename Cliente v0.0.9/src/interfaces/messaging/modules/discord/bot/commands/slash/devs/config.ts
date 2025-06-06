import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder,
	ChannelType, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@modules/discord/structure/extends/embeds.extend";
import { logWithLabel } from "@utils/functions/console";

//TODO: Seguir Mejorandolo

export default new Command(
  new SlashCommandBuilder()
    .setName("config")
    .setNameLocalizations({
      "es-ES": "configuracion",
    })
    .setDescription("configuration the functions of the discord bot")
    .setDescriptionLocalizations({
      "es-ES": "configuracion las funciones del bot de discord",
    }),
  async (client, interaction) => {
    try {
      if (!interaction.guild || !interaction.channel || !client.user) return;
      const guild = await main.prisma.myGuild.findUnique({
        where: { guildId: interaction.guild.id },
      });
      const data = await main.prisma.myDiscord.findUnique({ where: { clientId: client.user.id } });

      if (!data || !guild) {
        return interaction.reply({
          embeds: [
            new ErrorEmbed()
              .setTitle("Error Configuration")
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} **Error**`,
                  `No valid configuration found for this server.`,
                ].join("\n"),
              ),
          ],
        });
      }

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
          .setLabel(guild.eventlogs?.enabled ? "Disable Log Events" : "Enable Log Events")
          .setCustomId("button-enabled-logevents")
          .setStyle(guild.eventlogs?.enabled ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel("Cancel")
          .setCustomId("button-set-config-cancel") // Fixed typo
          .setStyle(ButtonStyle.Danger),
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
                  ? client.getEmoji(interaction.guild.id, "circle_check")
                  : client.getEmoji(interaction.guild.id, "circle_x"),
              )
              .setDescription("Enable or disable error logging"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Enabled Log Debug")
              .setValue("log-debug")
              .setEmoji(
                data.logconsole
                  ? client.getEmoji(interaction.guild.id, "circle_check")
                  : client.getEmoji(interaction.guild.id, "circle_x"),
              )
              .setDescription("Enable or disable debug logging"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Set Webhook")
              .setValue("webhook-config")
              .setEmoji(client.getEmoji(interaction.guild.id, "settings"))
              .setDescription("Set the webhook URL"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Set Log Channel")
              .setValue("log-channel-config")
              .setEmoji(client.getEmoji(interaction.guild.id, "folder"))
              .setDescription("Set the channel for event and control logs"),
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
        try {
          if (i.isButton()) {
            switch (i.customId) {
              case "button-set-config-cancel":
                await i.update({
                  embeds: [
                    new EmbedCorrect()
                      .setTitle("Configuration")
                      .setDescription(
                        `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                          `The configuration has been cancelled.`,
                      ),
                  ],
                  components: [],
                });
                collector.stop();
                break;
            }
          } else if (i.isStringSelectMenu()) {
            switch (i.customId) {
              case "menu:config-panel":
                switch (
                  i.values[0] // <--- Mejor escalabilidad
                ) {
                  case "log-errors": {
                    const newValue = !data.errorlog;
                    await main.prisma.myDiscord.update({
                      where: { clientId: client.user?.id },
                      data: { errorlog: newValue },
                    });
                    setTimeout(async () => {
                      await i.update({
                        embeds: [
                          new EmbedCorrect()
                            .setTitle("Configuration")
                            .setDescription(
                              `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                                `The error log has been ${newValue ? "enabled" : "disabled"}.`,
                            ),
                        ],
                        components: [],
                      });
                    }, 1000);
                    break;
                  }
                  case "log-debug": {
                    const newValue = !data.logconsole;
                    await main.prisma.myDiscord.update({
                      where: { clientId: client.user?.id },
                      data: { logconsole: newValue },
                    });
                    setTimeout(async () => {
                      await i.update({
                        embeds: [
                          new EmbedCorrect()
                            .setTitle("Configuration")
                            .setDescription(
                              `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                                `The debug log has been ${newValue ? "enabled" : "disabled"}.`,
                            ),
                        ],
                        components: [],
                      });
                    }, 1000);
                    break;
                  }
                  case "webhook-config": {
                    await i.reply({
                      embeds: [
                        new EmbedCorrect()
                          .setTitle("Configuration")
                          .setDescription(
                            `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                              `You have selected the webhook configuration option.`,
                          ),
                      ],
                      components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                          new ButtonBuilder()
                            .setLabel("Set URL")
                            .setCustomId("button-set-webhook-config")
                            .setStyle(ButtonStyle.Primary),
                          new ButtonBuilder()
                            .setLabel("Create")
                            .setCustomId("button-create-webhook-config")
                            .setStyle(ButtonStyle.Success),
                          new ButtonBuilder()
                            .setLabel("Delete")
                            .setCustomId("button-delete-webhook-config")
                            .setStyle(ButtonStyle.Danger),
                        ),
                      ],
                      flags: "Ephemeral",
                    });
                    break;
                  }
                  case "log-channel-config": {
                    await i.reply({
                      embeds: [
                        new EmbedCorrect()
                          .setTitle("Configuration")
                          .setDescription(
                            `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
                              `Please select the channel where event and control logs will be sent.`,
                          ),
                      ],
                      components: [
                        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                          new ChannelSelectMenuBuilder()
                            .setCustomId("select-log-channel")
                            .setPlaceholder("Select a channel")
                            .setChannelTypes([ChannelType.GuildText]), // <--- Mejor legibilidad
                        ),
                      ],
                      flags: "Ephemeral",
                    });
                    break;
                  }
                  default:
                    break;
                }
                break;
            }
          }
        } catch (error) {
          logWithLabel("error", ["Error in collector interaction:", error].join("\n"));
        }
      });

      collector.on("end", async () => {
        try {
          await interaction.editReply({
            components: [],
          });
        } catch (error) {
          logWithLabel("error", ["Error in collector end interaction:", error].join("\n"));
        }
      });

      return message;
    } catch (error) {
      logWithLabel("error", ["Error in config command:", error].join("\n"));
      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Unexpected Error")
            .setDescription("An unexpected error occurred. Please try again later."),
        ],
        flags: "Ephemeral",
      });
    }

    return;
  },
);
