import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder,
	ChannelType, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";
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
      // Traducción
      const lang =
        (interaction.guild &&
          (await main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild.id } }))?.lenguage) ||
        interaction.locale ||
        "es-ES";
      const t = (key: string, options?: any) => client.translations.t(key, { lng: lang, ...options });

      const guild = await main.prisma.myGuild.findUnique({
        where: { guildId: interaction.guild.id },
      });
      const data = await main.DB.findDiscord(client.user.id);
      if (!data || !guild) {
        return interaction.reply({
          embeds: [
            new ErrorEmbed()
              .setTitle(t("config.errorTitle"))
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id, "error")} **${t("config.error")}**`,
                  t("config.noValidConfig"),
                ].join("\n"),
              ),
          ],
        });
      }

      const embed = new EmbedCorrect()
        .setTitle(t("config.title"))
        .setDescription(
          [
            `${client.getEmoji(interaction.guild.id, "correct")} **${t("config.title")}**`,
            t("config.selectOption"),
          ].join("\n"),
        );

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(guild.eventlogs?.enabled ? t("config.disableLogEvents") : t("config.enableLogEvents"))
          .setCustomId("button-enabled-logevents")
          .setStyle(guild.eventlogs?.enabled ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel(t("config.cancel"))
          .setCustomId("button-set-config-cancel")
          .setStyle(ButtonStyle.Danger),
      );

      const menus = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("menu:config-panel")
          .setPlaceholder(t("config.selectConfigOption"))
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(t("config.enabledLogErrors"))
              .setValue("log-errors")
              .setEmoji(
                data.errorlog
                  ? client.getEmoji(interaction.guild.id, "circle_check")
                  : client.getEmoji(interaction.guild.id, "circle_x"),
              )
              .setDescription(t("config.enableDisableErrorLog")),
            new StringSelectMenuOptionBuilder()
              .setLabel(t("config.enabledLogDebug"))
              .setValue("log-debug")
              .setEmoji(
                data.logconsole
                  ? client.getEmoji(interaction.guild.id, "circle_check")
                  : client.getEmoji(interaction.guild.id, "circle_x"),
              )
              .setDescription(t("config.enableDisableDebugLog")),
            new StringSelectMenuOptionBuilder()
              .setLabel(t("config.setWebhook"))
              .setValue("webhook-config")
              .setEmoji(client.getEmoji(interaction.guild.id, "settings"))
              .setDescription(t("config.setWebhookDesc")),
            new StringSelectMenuOptionBuilder()
              .setLabel(t("config.setLogChannel"))
              .setValue("log-channel-config")
              .setEmoji(client.getEmoji(interaction.guild.id, "folder"))
              .setDescription(t("config.setLogChannelDesc")),
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
                      .setTitle(t("config.title"))
                      .setDescription(
                        `${client.getEmoji(interaction.guildId as string, "correct")} **${t("config.title")}**\n` +
                          t("config.cancelled"),
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
                switch (i.values[0]) {
                  case "log-errors": {
                    const newValue = !data.errorlog;
                    await main.prisma.discord.update({
                      where: { clientId: client.user?.id as string },
                      data: {
                        errorlog: newValue,
                      },
                    });
                    setTimeout(async () => {
                      await i.update({
                        embeds: [
                          new EmbedCorrect()
                            .setTitle(t("config.title"))
                            .setDescription(
                              `${client.getEmoji(interaction.guildId as string, "correct")} **${t("config.title")}**\n` +
                                t(newValue ? "config.errorLogEnabled" : "config.errorLogDisabled"),
                            ),
                        ],
                        components: [],
                      });
                    }, 1000);
                    break;
                  }
                  case "log-debug": {
                    const newValue = !data.logconsole;
                    await main.prisma.discord.update({
                      where: { clientId: client.user?.id as string },
                      data: {
                        logconsole: newValue,
                      },
                    });
                    setTimeout(async () => {
                      await i.update({
                        embeds: [
                          new EmbedCorrect()
                            .setTitle(t("config.title"))
                            .setDescription(
                              `${client.getEmoji(interaction.guildId as string, "correct")} **${t("config.title")}**\n` +
                                t(newValue ? "config.debugLogEnabled" : "config.debugLogDisabled"),
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
                          .setTitle(t("config.title"))
                          .setDescription(
                            `${client.getEmoji(interaction.guildId as string, "correct")} **${t("config.title")}**\n` +
                              t("config.webhookSelected"),
                          ),
                      ],
                      components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                          new ButtonBuilder()
                            .setLabel(t("config.setUrl"))
                            .setCustomId("button-set-webhook-config")
                            .setStyle(ButtonStyle.Primary),
                          new ButtonBuilder()
                            .setLabel(t("config.create"))
                            .setCustomId("button-create-webhook-config")
                            .setStyle(ButtonStyle.Success),
                          new ButtonBuilder()
                            .setLabel(t("config.delete"))
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
                          .setTitle(t("config.title"))
                          .setDescription(
                            `${client.getEmoji(interaction.guildId as string, "correct")} **${t("config.title")}**\n` +
                              t("config.selectLogChannel"),
                          ),
                      ],
                      components: [
                        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                          new ChannelSelectMenuBuilder()
                            .setCustomId("select-log-channel")
                            .setPlaceholder(t("config.selectChannel"))
                            .setChannelTypes([ChannelType.GuildText]),
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
      const lang =
        (interaction.guild &&
          (await main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild.id } }))?.lenguage) ||
        interaction.locale ||
        "es-ES";
      const t = (key: string, options?: any) => client.translations.t(key, { lng: lang, ...options });
      logWithLabel("error", ["Error in config command:", error].join("\n"));
      await interaction.reply({
        embeds: [
          new ErrorEmbed().setTitle(t("config.unexpectedErrorTitle")).setDescription(t("config.unexpectedErrorDesc")),
        ],
        flags: "Ephemeral",
      });
    }

    return;
  },
);
