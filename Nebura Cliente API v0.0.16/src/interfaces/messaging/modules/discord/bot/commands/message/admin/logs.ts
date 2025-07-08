import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType } from "discord.js";

import { main } from "@/main";
import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const logAdminCommand: Precommand = {
  name: "logs",
  nameLocalizations: {
    "es-ES": "registros",
    "en-US": "logs",
  },
  description: "Get the logs of a user (warns, bans, kicks)",
  descriptionLocalizations: {
    "es-ES": "Obtén los registros de un usuario (advertencias, expulsiones, baneos)",
    "en-US": "Get the logs of a user (warnings, bans, kicks)",
  },
  examples: ["logs warns @user 3"],
  nsfw: false,
  category: "Admin",
  cooldown: 5,
  owner: false,
  aliases: ["modlogs"],
  subcommands: ["logs warns @user page", "logs bans"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    const lang = message.guild?.preferredLocale || "es-ES";
    const args = message.content.split(/\s+/).slice(1); // Extrae los argumentos del mensaje
    const subCommand = args[0]?.toLowerCase();
    const userMention = message.mentions.users.first();
    const page = parseInt(args[2]) || 1; // Página por defecto es 1 si no se proporciona

    try {
      switch (subCommand) {
        case "warns": {
          if (!userMention) {
            return message.channel.send({
              embeds: [
                new ErrorEmbed().setDescription(
                  [
                    `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:logs-message.userNotFound", {}, lang)}`,
                    client.t("discord:logs-message.mentionValidUser", {}, lang),
                  ].join("\n"),
                ),
              ],
            });
          }

          const userWarnings = await main.prisma.userWarn.findMany({
            where: {
              userId: userMention.id,
              guildId: message.guild.id,
            },
          });

          if (!userWarnings?.length) {
            return message.channel.send({
              embeds: [
                new ErrorEmbed()
                  .setTitle(client.t("discord:logs-message.noWarningsTitle", {}, lang))
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:logs-message.noWarningsDesc", {}, lang)}`,
                      client.t("discord:logs-message.checkSettings", {}, lang),
                    ].join("\n"),
                  ),
              ],
            });
          }

          if (page < 1 || page > Math.ceil(userWarnings.length / 5)) {
            return message.channel.send({
              embeds: [
                new ErrorEmbed()
                  .setTitle(client.t("discord:logs-message.invalidPageTitle", {}, lang))
                  .setDescription(
                    client.t(
                      "discord:logs-message.invalidPageDesc",
                      { min: 1, max: Math.ceil(userWarnings.length / 5) },
                      lang,
                    ),
                  ),
              ],
            });
          }

          const embed = new EmbedCorrect().setTitle(
            client.t("discord:logs-message.warnsTitle", { user: userMention.tag }, lang),
          );
          const pageNum = 5 * (page - 1);

          if (userWarnings.length >= 6) {
            embed.setFooter({
              text: client.t(
                "discord:logs-message.pageFooter",
                { page, total: Math.ceil(userWarnings.length / 5) },
                lang,
              ),
            });
          }

          for (const warnings of userWarnings.splice(pageNum, 5)) {
            const moderator = message.guild.members.cache.get(warnings.moderator);

            embed.addFields({
              name: client.t("discord:logs-message.warnId", { id: warnings.id }, lang),
              value: [
                `> ${client.t("discord:logs-message.moderator", {}, lang)}: ${moderator || client.t("discord:logs-message.moderatorLeft", {}, lang)}`,
                `> ${client.t("discord:logs-message.user", {}, lang)}: ${warnings.userId}`,
                `> ${client.t("discord:logs-message.reason", {}, lang)}: \`${warnings.warnReason}\``,
                `> ${client.t("discord:logs-message.date", {}, lang)}: ${warnings.warnDate}`,
              ].join("\n"),
            });
          }

          await message.channel.send({ embeds: [embed] });
          break;
        }

        case "bans": {
          const bans = await message.guild.bans.fetch();
          if (!bans.size) {
            return message.channel.send({
              embeds: [
                new ErrorEmbed()
                  .setTitle(client.t("discord:logs-message.noBansTitle", {}, lang))
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:logs-message.noBansDesc", {}, lang)}`,
                      client.t("discord:logs-message.checkSettings", {}, lang),
                    ].join("\n"),
                  ),
              ],
            });
          }

          const bansArray = Array.from(bans.values());
          const maxFieldsPerPage = 10;
          const totalPages = Math.ceil(bansArray.length / maxFieldsPerPage);
          let currentPage = Math.min(Math.max(page, 1), totalPages);

          const generateEmbed = (page: number) => {
            const embed = new EmbedCorrect().setTitle(client.t("discord:logs-message.bansTitle", {}, lang));
            const start = (page - 1) * maxFieldsPerPage;
            const end = start + maxFieldsPerPage;

            bansArray.slice(start, end).forEach((ban) => {
              embed.addFields({
                name: client.t("discord:logs-message.banUser", { user: ban.user.tag }, lang),
                value: client.t("discord:logs-message.banId", { id: ban.user.id }, lang),
              });
            });

            embed.setFooter({ text: client.t("discord:logs-message.pageFooter", { page, total: totalPages }, lang) });
            return embed;
          };

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("prev_page")
              .setLabel(client.t("discord:logs-message.prev", {}, lang))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId("next_page")
              .setLabel(client.t("discord:logs-message.next", {}, lang))
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === totalPages),
          );

          const embedMessage = await message.channel.send({
            embeds: [generateEmbed(currentPage)],
            components: totalPages > 1 ? [row] : [],
          });

          if (totalPages > 1) {
            const collector = embedMessage.createMessageComponentCollector({
              componentType: ComponentType.Button,
              time: 60000,
            });

            collector.on("collect", async (interaction) => {
              if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                  content: client.t("discord:logs-message.paginationNotAllowed", {}, lang),
                  ephemeral: true,
                });
              }

              if (interaction.customId === "prev_page" && currentPage > 1) {
                currentPage--;
              } else if (interaction.customId === "next_page" && currentPage < totalPages) {
                currentPage++;
              }

              await interaction.update({
                embeds: [generateEmbed(currentPage)],
                components: [
                  new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                      .setCustomId("prev_page")
                      .setLabel(client.t("discord:logs-message.prev", {}, lang))
                      .setStyle(ButtonStyle.Primary)
                      .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                      .setCustomId("next_page")
                      .setLabel(client.t("discord:logs-message.next", {}, lang))
                      .setStyle(ButtonStyle.Primary)
                      .setDisabled(currentPage === totalPages),
                  ),
                ],
              });

              return;
            });

            collector.on("end", () => {
              embedMessage.edit({ components: [] }).catch(() => {});
            });
          }
          break;
        }

        default:
          message.channel.send({
            embeds: [
              new ErrorEmbed()
                .setTitle(client.t("discord:logs-message.invalidSubTitle", {}, lang))
                .setDescription(client.t("discord:logs-message.invalidSubDesc", {}, lang)),
            ],
          });
          break;
      }
    } catch (error: any) {
      console.error("Error handling logs command:", error);
      await message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle(client.t("discord:logs-message.unexpectedTitle", {}, lang))
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:logs-message.unexpectedDesc", {}, lang)}`,
                client.t("discord:logs-message.tryAgain", {}, lang),
              ].join("\n"),
            ),
        ],
      });
    }

    return;
  },
};

export = logAdminCommand;
