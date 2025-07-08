import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType,
	PermissionFlagsBits, TextChannel
} from "discord.js";

import { main } from "@/main";
import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

/**
 * Interactive command to configure the NSFW channel for the server.
 * Allows admins to select a text channel as the NSFW channel using a channel select menu and confirm/cancel buttons.
 */
const autonsfwCommand: Precommand = {
  name: "autonsfw",
  nameLocalizations: {
    "es-ES": "autonsfw",
    "en-US": "autonsfw",
  },
  description: "Configure the NSFW channel for this server.",
  descriptionLocalizations: {
    "es-ES": "Configurar el canal NSFW para este servidor.",
    "en-US": "Configure the NSFW channel for this server.",
  },
  examples: ["autonsfw"],
  nsfw: false,
  owner: false,
  cooldown: 30,
  category: "Configuration",
  aliases: ["setnsfw", "nsfwchannel"],
  botpermissions: ["SendMessages", "ManageChannels"],
  permissions: ["Administrator"],
  async execute(_client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Multilenguaje
    const userLang = message.guild?.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = _client.translations.getFixedT(lang, "discord");

    const subcommand = args[0];
    switch (subcommand) {
      case "set":
        {
          // Fetch all text channels with strong typing
          const textChannels: TextChannel[] = message.guild.channels.cache
            .filter(
              (ch): ch is TextChannel =>
                ch.type === ChannelType.GuildText &&
                ch.viewable &&
                ch.permissionsFor(message.guild!.members.me!)?.has(PermissionFlagsBits.SendMessages),
            )
            .map((ch) => ch);

          if (textChannels.length === 0) {
            return message.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("autonsfw.noTextChannelsTitle"))
                  .setDescription(t("autonsfw.noTextChannelsDesc")),
              ],
            });
          }

          // Channel select menu (only text channels)
          const selectMenu = new ChannelSelectMenuBuilder()
            .setCustomId("autonsfw_select")
            .setPlaceholder(t("autonsfw.selectChannelPlaceholder"))
            .setChannelTypes(ChannelType.GuildText)
            .setMinValues(1)
            .setMaxValues(1);

          const confirmButton = new ButtonBuilder()
            .setCustomId("autonsfw_confirm")
            .setLabel(t("autonsfw.confirmButton"))
            .setStyle(ButtonStyle.Success)
            .setDisabled(true);

          const cancelButton = new ButtonBuilder()
            .setCustomId("autonsfw_cancel")
            .setLabel(t("autonsfw.cancelButton"))
            .setStyle(ButtonStyle.Danger);

          const rowMenu = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(selectMenu);
          const rowButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

          const embed = new EmbedCorrect().setTitle(t("autonsfw.configTitle")).setDescription(t("autonsfw.configDesc"));

          const sentMsg = await message.channel.send({
            embeds: [embed],
            components: [rowMenu, rowButtons],
          });

          let selectedChannelId: string | null = null;

          const collector = sentMsg.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60_000,
          });

          collector.on("collect", async (interaction) => {
            if (interaction.isChannelSelectMenu() && interaction.customId === "autonsfw_select") {
              const channelId = interaction.values[0];
              const selectedChannel = message.guild!.channels.cache.get(channelId);
              if (!selectedChannel || selectedChannel.type !== ChannelType.GuildText) {
                return interaction.reply({
                  content: t("autonsfw.invalidChannel"),
                  flags: "Ephemeral",
                });
              }
              selectedChannelId = channelId;
              // Enable confirm button
              const updatedConfirm = ButtonBuilder.from(confirmButton).setDisabled(false);
              const updatedRowButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                updatedConfirm,
                cancelButton,
              );
              await interaction.update({
                components: [rowMenu, updatedRowButtons],
              });
            } else if (interaction.isButton()) {
              if (interaction.customId === "autonsfw_confirm") {
                if (!selectedChannelId) {
                  return interaction.reply({
                    content: t("autonsfw.selectFirst"),
                    flags: "Ephemeral",
                  });
                }
                // Update DB
                await main.prisma.myGuild.update({
                  where: { guildId: message.guild!.id },
                  data: { nsfwChannel: selectedChannelId },
                });
                await interaction.update({
                  embeds: [
                    new EmbedCorrect()
                      .setTitle(t("autonsfw.setTitle"))
                      .setDescription(t("autonsfw.setDesc", { channel: `<#${selectedChannelId}>` })),
                  ],
                  components: [],
                });
                collector.stop();
              } else if (interaction.customId === "autonsfw_cancel") {
                await interaction.update({
                  embeds: [
                    new ErrorEmbed().setTitle(t("autonsfw.cancelledTitle")).setDescription(t("autonsfw.cancelledDesc")),
                  ],
                  components: [],
                });
                collector.stop();
              }
            }

            return;
          });

          collector.on("end", async (_, reason) => {
            if (reason === "time") {
              await sentMsg.edit({
                embeds: [
                  new EmbedCorrect().setTitle(t("autonsfw.expiredTitle")).setDescription(t("autonsfw.expiredDesc")),
                ],
                components: [],
              });
            }
          });
        }
        break;
      case "remove":
        {
          // Get current NSFW channel
          const myGuild = await main.prisma.myGuild.findUnique({
            where: { guildId: message.guild!.id },
          });

          if (!myGuild?.nsfwChannel) {
            return message.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("autonsfw.noConfiguredTitle"))
                  .setDescription(t("autonsfw.noConfiguredDesc")),
              ],
            });
          }

          const confirmButton = new ButtonBuilder()
            .setCustomId("autonsfw_remove_confirm")
            .setLabel(t("autonsfw.removeConfirmButton"))
            .setStyle(ButtonStyle.Danger);

          const cancelButton = new ButtonBuilder()
            .setCustomId("autonsfw_remove_cancel")
            .setLabel(t("autonsfw.cancelButton"))
            .setStyle(ButtonStyle.Secondary);

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

          const embed = new EmbedCorrect()
            .setTitle(t("autonsfw.removeTitle"))
            .setDescription(t("autonsfw.removeDesc", { channel: `<#${myGuild.nsfwChannel}>` }));

          const sentMsg = await message.channel.send({
            embeds: [embed],
            components: [row],
          });

          const collector = sentMsg.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60_000,
          });

          collector.on("collect", async (interaction) => {
            if (interaction.isButton()) {
              if (interaction.customId === "autonsfw_remove_confirm") {
                await main.prisma.myGuild.update({
                  where: { guildId: message.guild!.id },
                  data: { nsfwChannel: null },
                });
                await interaction.update({
                  embeds: [
                    new EmbedCorrect().setTitle(t("autonsfw.removedTitle")).setDescription(t("autonsfw.removedDesc")),
                  ],
                  components: [],
                });
                collector.stop();
              } else if (interaction.customId === "autonsfw_remove_cancel") {
                await interaction.update({
                  embeds: [
                    new ErrorEmbed()
                      .setTitle(t("autonsfw.removeCancelledTitle"))
                      .setDescription(t("autonsfw.removeCancelledDesc")),
                  ],
                  components: [],
                });
                collector.stop();
              }
            }
          });

          collector.on("end", async (_, reason) => {
            if (reason === "time") {
              await sentMsg.edit({
                embeds: [
                  new EmbedCorrect()
                    .setTitle(t("autonsfw.removeExpiredTitle"))
                    .setDescription(t("autonsfw.removeExpiredDesc")),
                ],
                components: [],
              });
            }
          });
        }
        break;
    }

    return;
  },
};

export = autonsfwCommand;
