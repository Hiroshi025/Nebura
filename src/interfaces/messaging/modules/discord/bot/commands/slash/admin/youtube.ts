import {
	ApplicationIntegrationType, ChannelType, PermissionFlagsBits, SlashCommandBuilder
} from "discord.js";
import Parser from "rss-parser";

import { main } from "@/main";
import { channelId } from "@gonetone/get-youtube-id-by-url";
import { Command } from "@messaging/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";

const fetch = new Parser();
export default new Command(
  new SlashCommandBuilder()
    .setName("youtube")
    .setDescription("Configure YouTube notifications system")
    .setDescriptionLocalizations({
      "es-ES": "Configurar el sistema de notificaciones de YouTube",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setNameLocalizations({
          "es-ES": "agregar",
        })
        .setDescription("Add a YouTube channel for notifications")
        .setDescriptionLocalizations({
          "es-ES": "Agregar un canal de YouTube para notificaciones",
        })
        .addStringOption((opt) =>
          opt
            .setName("link")
            .setNameLocalizations({
              "es-ES": "enlace",
            })
            .setDescription("Provide the YouTube channel link")
            .setDescriptionLocalizations({
              "es-ES": "Proporciona el enlace del canal de YouTube",
            })
            .setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setNameLocalizations({
              "es-ES": "canal",
            })
            .setDescription("Select the channel to send notifications")
            .setDescriptionLocalizations({
              "es-ES": "Selecciona el canal para enviar notificaciones",
            })
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildForum,
              ChannelType.GuildVoice,
              ChannelType.GuildAnnouncement,
            )
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("message")
            .setNameLocalizations({
              "es-ES": "mensaje",
            })
            .setDescription("Custom notification message, {user} = youtuber")
            .setDescriptionLocalizations({
              "es-ES": "Mensaje de notificación personalizado, {user} = youtuber",
            })
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setNameLocalizations({
          "es-ES": "editar",
        })
        .setDescription("Edit the notification message or channel")
        .setDescriptionLocalizations({
          "es-ES": "Editar el mensaje de notificación o canal",
        })
        .addStringOption((opt) =>
          opt
            .setName("link")
            .setNameLocalizations({
              "es-ES": "enlace",
            })
            .setDescription("YouTube channel link to edit")
            .setDescriptionLocalizations({
              "es-ES": "Enlace del canal de YouTube a editar",
            })
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("message")
            .setNameLocalizations({
              "es-ES": "mensaje",
            })
            .setDescription("New custom message, {user} = youtuber")
            .setDescriptionLocalizations({
              "es-ES": "Nuevo mensaje personalizado, {user} = youtuber",
            })
            .setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setNameLocalizations({
              "es-ES": "canal",
            })
            .setDescription("New channel for notifications")
            .setDescriptionLocalizations({
              "es-ES": "Nuevo canal para notificaciones",
            })
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildForum,
              ChannelType.GuildVoice,
              ChannelType.GuildAnnouncement,
            )
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setNameLocalizations({
          "es-ES": "eliminar",
        })
        .setDescription("Remove a YouTube channel from notifications")
        .setDescriptionLocalizations({
          "es-ES": "Eliminar un canal de YouTube de las notificaciones",
        })
        .addStringOption((opt) =>
          opt
            .setName("link")
            .setNameLocalizations({
              "es-ES": "enlace",
            })
            .setDescription("YouTube channel link to remove")
            .setDescriptionLocalizations({
              "es-ES": "Enlace del canal de YouTube a eliminar",
            })
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setNameLocalizations({
          "es-ES": "listar",
        })
        .setDescription("List all YouTube channels configured for notifications")
        .setDescriptionLocalizations({
          "es-ES": "Listar todos los canales de YouTube configurados para notificaciones",
        }),
    ),
  async (client, interaction) => {
    const { options, guild } = interaction;
    if (!guild || !interaction.channel) return;
    const subcommands = options.getSubcommand();

    let data = await main.prisma.youtube.findFirst({
      where: {
        serverId: guild.id,
      },
    });

    const youtubers = await main.prisma.youtuber.findMany({
      where: {
        guildId: guild.id,
      },
    });

    if (!data) {
      data = await main.prisma.youtube.create({
        data: {
          serverId: guild.id,
          serverName: guild.name || "Unknown Server",
        },
      });
    }

    const userLang = interaction.guild?.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = client.translations.getFixedT(lang, "discord");

    switch (subcommands) {
      case "add":
        {
          const link = options.getString("link", true);
          const channel = options.getChannel("channel", true);
          const message = options.getString("message") || "{user} has uploaded a new video!";

          if ((link && !link.toLowerCase().includes("http")) || !link.toLowerCase().includes("youtube")) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("youtube.invalidLinkTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.invalidLinkDesc1")}`,
                      t("youtube.invalidLinkDesc2"),
                    ].join("\n"),
                  ),
              ],
            });
          }

          if (youtubers.some((u) => u.url?.toLowerCase() === link.toLowerCase())) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("youtube.existsTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.existsDesc1")}`,
                      t("youtube.existsDesc2"),
                    ].join("\n"),
                  ),
              ],
            });
            return;
          }

          if (
            channel.type !== ChannelType.GuildText &&
            channel.type !== ChannelType.GuildForum &&
            channel.type !== ChannelType.GuildVoice &&
            channel.type !== ChannelType.GuildAnnouncement
          ) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("youtube.invalidChannelTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.invalidChannelDesc1")}`,
                      t("youtube.invalidChannelDesc2"),
                    ].join("\n"),
                  ),
              ],
            });
            return;
          }

          await channelId(link).then(async (id) => {
            await fetch.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`).then(async (response) => {
              const name = response.title;
              const url = response.link;
              if (!message) {
                if (youtubers.some((u) => u.userId?.toLowerCase() === id.toLowerCase())) {
                  await interaction.reply({
                    embeds: [
                      new ErrorEmbed()
                        .setTitle(t("youtube.existsTitle"))
                        .setDescription(
                          [
                            `${client.getEmoji(guild.id as string, "error")} ${t("youtube.existsDesc1")}`,
                            t("youtube.existsDesc2"),
                          ].join("\n"),
                        ),
                    ],
                  });
                }

                await main.prisma.youtuber.create({
                  data: {
                    name: name,
                    userId: id,
                    channelId: channel.id,
                    guildId: guild.id,
                    channelName: channel.name,
                    url: url,
                  },
                });

                await interaction.reply({
                  embeds: [
                    new EmbedCorrect()
                      .setTitle(t("youtube.addedTitle"))
                      .setDescription(
                        [
                          `${client.getEmoji(guild.id as string, "success")} ${t("youtube.addedDesc")}`,
                          `${t("youtube.channel")}: ${channel.name}`,
                          `${t("youtube.user")}: ${name}`,
                          `${t("youtube.url")}: ${url}`,
                        ].join("\n"),
                      ),
                  ],
                });
              } else if (message) {
                if (message.length > 1024) {
                  await interaction.reply({
                    embeds: [
                      new ErrorEmbed()
                        .setTitle(t("youtube.msgLongTitle"))
                        .setDescription(
                          [
                            `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.msgLongDesc1")}`,
                            t("youtube.msgLongDesc2"),
                          ].join("\n"),
                        ),
                    ],
                  });
                  return;
                }

                if (youtubers.some((u) => u.userId?.toLowerCase() === id.toLowerCase())) {
                  await interaction.reply({
                    embeds: [
                      new ErrorEmbed()
                        .setTitle(t("youtube.existsTitle"))
                        .setDescription(
                          [
                            `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.existsDesc1")}`,
                            t("youtube.existsDesc2"),
                          ].join("\n"),
                        ),
                    ],
                  });
                }

                await main.prisma.youtuber.create({
                  data: {
                    name: name,
                    userId: id,
                    channelId: channel.id,
                    channelName: channel.name,
                    guildId: guild.id,
                    url: url,
                    message: message,
                  },
                });

                await interaction.reply({
                  embeds: [
                    new EmbedCorrect()
                      .setTitle(t("youtube.addedTitle"))
                      .setDescription(
                        [
                          `${client.getEmoji(guild?.id as string, "success")} ${t("youtube.addedDesc")}`,
                          `${t("youtube.channel")}: ${channel.name}`,
                          `${t("youtube.user")}: ${name}`,
                          `${t("youtube.url")}: ${url}`,
                          `${t("youtube.message")}: ${message}`,
                        ].join("\n"),
                      ),
                  ],
                });
              }
            });
          });
        }
        break;
      case "edit":
        {
          const link = options.getString("link", true);
          const message = options.getString("message", true);
          const channel = options.getChannel("channel");

          if (!link.toLowerCase().includes("http") || !link.toLowerCase().includes("youtube")) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("youtube.invalidLinkTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.invalidLinkDesc1")}`,
                      t("youtube.validLinks"),
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          const youtuber = youtubers.find((u) => u.url?.toLowerCase() === link.toLowerCase());

          if (!youtuber) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("youtube.notFoundTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.notFoundDesc1", { link })}`,
                      t("youtube.notFoundDesc2"),
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          if (message.length > 1024) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("youtube.msgLongTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.msgLongDesc1")}`,
                      t("youtube.msgLongDesc2"),
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          if (channel) {
            if (
              channel.type !== ChannelType.GuildText &&
              channel.type !== ChannelType.GuildForum &&
              channel.type !== ChannelType.GuildVoice &&
              channel.type !== ChannelType.GuildAnnouncement
            ) {
              await interaction.reply({
                embeds: [
                  new ErrorEmbed()
                    .setTitle(t("youtube.invalidChannelTitle"))
                    .setDescription(
                      [
                        `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.invalidChannelDesc1")}`,
                        t("youtube.invalidChannelDesc3"),
                      ].join("\n"),
                    ),
                ],
                flags: "Ephemeral",
              });
              return;
            }

            await main.prisma.youtuber.update({
              where: {
                id: youtuber.id,
              },
              data: {
                channelId: channel.id,
                channelName: channel.name,
                message: message,
              },
            });

            await interaction.reply({
              embeds: [
                new EmbedCorrect()
                  .setTitle(t("youtube.updatedTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "success")} ${t("youtube.updatedDesc")}`,
                      `${t("youtube.newChannel")}: ${channel.name}`,
                      `${t("youtube.newMessage")}: ${message}`,
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
          } else {
            await main.prisma.youtuber.update({
              where: {
                id: youtuber.id,
              },
              data: {
                message: message,
              },
            });

            await interaction.reply({
              embeds: [
                new EmbedCorrect()
                  .setTitle(t("youtube.updatedTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "success")} ${t("youtube.updatedMsgDesc")}`,
                      `${t("youtube.newMessage")}: ${message}`,
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
          }
        }
        break;

      case "remove":
        {
          const link = options.getString("link", true);

          const youtuber = youtubers.find((u) => u.url?.toLowerCase() === link.toLowerCase());

          if (!youtuber) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("youtube.notFoundTitle"))
                  .setDescription(
                    [`${client.getEmoji(guild?.id as string, "error")} ${t("youtube.notFoundDesc1", { link })}`].join(
                      "\n",
                    ),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          await main.prisma.youtuber.delete({
            where: {
              id: youtuber.id,
            },
          });

          await interaction.reply({
            embeds: [
              new EmbedCorrect()
                .setTitle(t("youtube.removedTitle"))
                .setDescription(
                  [
                    `${client.getEmoji(guild?.id as string, "success")} ${t("youtube.removedDesc")}`,
                    `${t("youtube.channel")}: ${youtuber.name} (${youtuber.url})`,
                  ].join("\n"),
                ),
            ],
            flags: "Ephemeral",
          });
        }
        break;

      case "list":
        {
          if (youtubers.length === 0) {
            await interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle(t("youtube.noChannelsTitle"))
                  .setDescription(
                    [
                      `${client.getEmoji(guild?.id as string, "error")} ${t("youtube.noChannelsDesc1")}`,
                      t("youtube.noChannelsDesc2"),
                    ].join("\n"),
                  ),
              ],
              flags: "Ephemeral",
            });
            return;
          }

          const fields = youtubers.map((youtuber, index) => {
            return {
              name: `${index + 1}. ${youtuber.name}`,
              value: [
                `**${t("youtube.userId")}:** \`${youtuber.userId}\``,
                `**${t("youtube.channel")}:** <#${youtuber.channelId}> (\`${youtuber.channelName}\`)`,
                `**${t("youtube.url")}:** [Link](${youtuber.url})`,
                `**${t("youtube.message")}:** \`${youtuber.message}\``,
              ].join("\n"),
            };
          });

          await interaction.reply({
            embeds: [
              new EmbedCorrect()
                .setTitle(t(`youtube.listTitle`, { guild: guild?.name }))
                .addFields(fields)
                .setFooter({
                  text: `${client.user?.username} | Team`,
                  iconURL: client.user?.displayAvatarURL(),
                }),
            ],
            flags: "Ephemeral",
          });
        }
        break;
    }
  },
);
