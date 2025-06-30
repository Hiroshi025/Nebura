import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

export default new Command(
  new SlashCommandBuilder()
    .setName("logs")
    .setNameLocalizations({
      "es-ES": "registros",
    })
    .setDescription("Get the logs of a user")
    .setDescriptionLocalizations({
      "es-ES": "Obtener los registros de un usuario",
    })
    .addSubcommand((subCmd) =>
      subCmd
        .setName("bans")
        .setNameLocalizations({
          "es-ES": "baneos",
        })
        .setDescription("Get the bans of a user in the guild all")
        .setDescriptionLocalizations({
          "es-ES": "Obtener los baneos de un usuario en la guild",
        }),
    )
    .addSubcommand((subCmd) =>
      subCmd
        .setName("warns")
        .setNameLocalizations({
          "es-ES": "advertencias",
        })
        .setDescription("Get the warns of a user")

        .setDescriptionLocalizations({
          "es-ES": "Obtener las advertencias de un usuario",
        })
        .addUserOption((option) => {
          return option
            .setName("user")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setDescription("User to get the warn logs for")
            .setDescriptionLocalizations({
              "es-ES": "Usuario para obtener los registros de advertencia",
            })
            .setRequired(true);
        })
        .addIntegerOption((option) => {
          return option
            .setName("page")
            .setNameLocalizations({
              "es-ES": "página",
            })
            .setDescription("The page to display if there are more than 1")
            .setDescriptionLocalizations({
              "es-ES": "La página a mostrar si hay más de 1",
            })
            .setMinValue(2)
            .setMaxValue(20);
        }),
    ),
  async (client, interaction) => {
    try {
      if (!interaction.guild || !interaction.channel || !interaction.user) return;

      // Obtener idioma preferido del usuario o guild
      const lang =
        (interaction.guild &&
          (await main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild.id } }))?.lenguage) ||
        interaction.locale ||
        "es-ES";
      const t = (key: string, options?: any) => client.translations.t(key, { lng: lang, ...options });

      switch (interaction.options.getSubcommand()) {
        case "warns":
          {
            const user = interaction.options.getUser("user");
            const page = interaction.options.getInteger("page") || 1;

            if (!user)
              return interaction.reply({
                embeds: [
                  new ErrorEmbed().setDescription(
                    [
                      `${client.getEmoji(interaction.guildId as string, "error")} ${t("logs.errors.userNotFound")}`,
                      t("logs.errors.provideValidUser"),
                    ].join("\n"),
                  ),
                ],
                flags: "Ephemeral",
              });

            const userWarnings = await main.prisma.userWarn.findMany({
              where: {
                userId: user.id,
                guildId: interaction.guild.id,
              },
            });

            if (!userWarnings?.length)
              return interaction.reply({
                embeds: [
                  new ErrorEmbed()
                    .setTitle(t("logs.warns.noWarningsTitle"))
                    .setDescription(
                      [
                        `${client.getEmoji(interaction.guildId as string, "error")} ${t("logs.warns.noWarningsDesc")}`,
                        t("logs.warns.checkSettings"),
                      ].join("\n"),
                    ),
                ],
                flags: "Ephemeral",
              });

            if (page < 1 || page > Math.ceil(userWarnings.length / 5)) {
              return interaction.reply({
                embeds: [
                  new ErrorEmbed()
                    .setTitle(t("logs.errors.invalidPageTitle"))
                    .setDescription(t("logs.errors.invalidPageDesc", { total: Math.ceil(userWarnings.length / 5) })),
                ],
                flags: "Ephemeral",
              });
            }

            const embed = new EmbedCorrect().setTitle(t("logs.warns.title", { user: user.tag }));

            const pageNum = 5 * (page - 1);

            if (userWarnings.length >= 6) {
              embed.setFooter({
                text: t("logs.pagination", { page, total: Math.ceil(userWarnings.length / 5) }),
              });
            }

            for (const warnings of userWarnings.splice(pageNum, 5)) {
              const moderator = interaction.guild.members.cache.get(warnings.moderator);

              embed.addFields({
                name: t("logs.warns.fieldId", { id: warnings.id }),
                value: [
                  `> ${t("logs.warns.fieldModerator")}: ${moderator || t("logs.warns.moderatorLeft")}`,
                  `> ${t("logs.warns.fieldUser")}: ${warnings.userId}`,
                  `> ${t("logs.warns.fieldReason")}: \`${warnings.warnReason}\``,
                  `> ${t("logs.warns.fieldDate")}: ${warnings.warnDate}`,
                ].join("\n"),
              });
            }

            await interaction.reply({ embeds: [embed] });
          }
          break;
        case "bans":
          {
            const bans = await interaction.guild.bans.fetch();
            if (!bans.size) {
              return interaction.reply({
                embeds: [
                  new ErrorEmbed()
                    .setTitle(t("logs.bans.noBansTitle"))
                    .setDescription(
                      [
                        `${client.getEmoji(interaction.guildId as string, "error")} ${t("logs.bans.noBansDesc")}`,
                        t("logs.bans.checkSettings"),
                      ].join("\n"),
                    ),
                ],
                flags: "Ephemeral",
              });
            }

            const bansArray = Array.from(bans.values());
            const maxFieldsPerPage = 10;
            const totalPages = Math.ceil(bansArray.length / maxFieldsPerPage);
            let currentPage = 1;

            const generateEmbed = (page: number) => {
              const embed = new EmbedCorrect().setTitle(t("logs.bans.title"));
              const start = (page - 1) * maxFieldsPerPage;
              const end = start + maxFieldsPerPage;

              bansArray.slice(start, end).forEach((ban) => {
                embed.addFields({
                  name: t("logs.bans.fieldUser", { user: ban.user.tag }),
                  value: t("logs.bans.fieldId", { id: ban.user.id }),
                });
              });

              embed.setFooter({ text: t("logs.pagination", { page, total: totalPages }) });
              return embed;
            };

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId("prev_page")
                .setLabel(t("logs.paginationPrev"))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1),
              new ButtonBuilder()
                .setCustomId("next_page")
                .setLabel(t("logs.paginationNext"))
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages),
            );

            const message = await interaction.reply({
              embeds: [generateEmbed(currentPage)],
              components: totalPages > 1 ? [row] : [],
              fetchReply: true,
            });

            if (totalPages > 1) {
              const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000,
              });

              collector.on("collect", async (i) => {
                if (i.user.id !== interaction.user.id) {
                  return i.reply({
                    content: t("logs.errors.cannotInteract"),
                    flags: "Ephemeral",
                  });
                }

                if (i.customId === "prev_page" && currentPage > 1) {
                  currentPage--;
                } else if (i.customId === "next_page" && currentPage < totalPages) {
                  currentPage++;
                }

                await i.update({
                  embeds: [generateEmbed(currentPage)],
                  components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                      new ButtonBuilder()
                        .setCustomId("prev_page")
                        .setLabel(t("logs.paginationPrev"))
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 1),
                      new ButtonBuilder()
                        .setCustomId("next_page")
                        .setLabel(t("logs.paginationNext"))
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === totalPages),
                    ),
                  ],
                });

                return;
              });

              collector.on("end", () => {
                message.edit({ components: [] }).catch(() => {});
              });
            }
          }
          break;
      }
    } catch (error: any) {
      console.error("Error handling logs command:", error);
      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Unexpected Error")
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string, "error")} ${client.translations.t("logs.errors.unexpected")}`,
                client.translations.t("logs.errors.tryAgain"),
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });
    }

    return;
  },
);
