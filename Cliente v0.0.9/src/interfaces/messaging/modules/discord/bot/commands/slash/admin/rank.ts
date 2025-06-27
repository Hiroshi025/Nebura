import { Profile } from "discord-arts";
import {
	AttachmentBuilder, GuildMember, PermissionFlagsBits, SlashCommandBuilder
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

export default new Command(
  new SlashCommandBuilder()
    .setName("rank")
    .setNameLocalizations({
      "es-ES": "rank",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDescription("👾 The ranking of the server")
    .setDescriptionLocalizations({
      "es-ES": "👾 El ranking del servidor",
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("use")
        .setNameLocalizations({
          "es-ES": "usar",
        })
        .setDescription("👾 Enable or disable the ranking system.")
        .setDescriptionLocalizations({
          "es-ES": "👾 Habilitar o deshabilitar el sistema de ranking.",
        })
        .addBooleanOption((option) =>
          option
            .setName("status")
            .setNameLocalizations({
              "es-ES": "estado",
            })
            .setDescription("👾 Status of the ranking system.")
            .setDescriptionLocalizations({
              "es-ES": "👾 Estado del sistema de ranking.",
            })
            .setRequired(true),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("ranking-notify")
        .setNameLocalizations({
          "es-ES": "notificar-ranking",
        })
        .setDescription("👾 Setup a channel to notify when a user levels up.")
        .setDescriptionLocalizations({
          "es-ES": "👾 Configura un canal para notificar cuando un usuario sube de nivel.",
        })
        .addSubcommand((subcommand) =>
          subcommand
            .setName("set")
            .setNameLocalizations({
              "es-ES": "establecer",
            })
            .setDescription("👾 Set a channel to notify when a user levels up.")
            .setDescriptionLocalizations({
              "es-ES": "👾 Establece un canal para notificar cuando un usuario sube de nivel.",
            })
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setNameLocalizations({
                  "es-ES": "canal",
                })
                .setDescription("👾 Channel to notify when a user levels up.")
                .setDescriptionLocalizations({
                  "es-ES": "👾 Canal para notificar cuando un usuario sube de nivel.",
                })
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setNameLocalizations({
              "es-ES": "eliminar",
            })
            .setDescription("👾 Remove a channel to notify when a user levels up.")
            .setDescriptionLocalizations({
              "es-ES": "👾 Elimina un canal para notificar cuando un usuario sube de nivel.",
            }),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("config")
        .setNameLocalizations({
          "es-ES": "configuracion",
        })
        .setDescription("👾 Configure the ranking system in the discord server")
        .setDescriptionLocalizations({
          "es-ES": "👾 Configura el sistema de ranking en el servidor de discord",
        })
        .addSubcommand((subcommand) =>
          subcommand
            .setName("card-background")
            .setNameLocalizations({
              "es-ES": "fondo-tarjeta",
            })
            .setDescription("👾 Change background Image on your card.")
            .setDescriptionLocalizations({
              "es-ES": "👾 Cambia la imagen de fondo en tu tarjeta.",
            })
            .addAttachmentOption((option) =>
              option
                .setName("image")
                .setNameLocalizations({
                  "es-ES": "imagen",
                })
                .setDescription("👾 Background Image (PNG format only)")
                .setDescriptionLocalizations({
                  "es-ES": "👾 Imagen de fondo (solo formato PNG)",
                })
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("card-barcolor")
            .setNameLocalizations({
              "es-ES": "color-barra",
            })
            .setDescription("👾 Change bar color on your card.")
            .setDescriptionLocalizations({
              "es-ES": "👾 Cambia el color de la barra en tu tarjeta.",
            })
            .addStringOption((option) =>
              option
                .setName("color")
                .setNameLocalizations({
                  "es-ES": "color",
                })
                .setDescription("👾 Bar Color (HEX format only)")
                .setDescriptionLocalizations({
                  "es-ES": "👾 Color de la barra (solo formato HEX)",
                })
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("card-blur")
            .setNameLocalizations({
              "es-ES": "desenfoque-tarjeta",
            })
            .setDescription("👾 Add a blur to your card")
            .setDescriptionLocalizations({
              "es-ES": "👾 Agrega un desenfoque a tu tarjeta",
            })
            .addNumberOption((option) =>
              option
                .setName("value")
                .setNameLocalizations({
                  "es-ES": "valor",
                })
                .setDescription("👾 Blur value (0-10)")
                .setDescriptionLocalizations({
                  "es-ES": "👾 Valor de desenfoque (0-10)",
                })
                .setMinValue(0)
                .setMaxValue(10)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("card-bordercolor")
            .setNameLocalizations({
              "es-ES": "color-borde",
            })
            .setDescription("👾 Change border color on your card.")
            .setDescriptionLocalizations({
              "es-ES": "👾 Cambia el color del borde en tu tarjeta.",
            })
            .addStringOption((option) =>
              option
                .setName("color")
                .setNameLocalizations({
                  "es-ES": "color",
                })
                .setDescription("👾 Border Color (HEX format only)")
                .setDescriptionLocalizations({
                  "es-ES": "👾 Color del borde (solo formato HEX)",
                })
                .setRequired(true),
            ),
        ),
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const group = interaction.options.getSubcommandGroup();
    switch (group) {
      case "config":
        {
          const subcommand = interaction.options.getSubcommand();
          switch (subcommand) {
            case "card-background":
              {
                try {
                  const image = interaction.options.getAttachment("image");
                  if (!image)
                    return await interaction.reply({
                      embeds: [
                        new ErrorEmbed()
                          .setColor("Red")
                          .setDescription(
                            [
                              `${client.getEmoji(interaction.guild.id, "error")} You must provide an image.`,
                              `\`Example:\` \`/config card-background --image <image.png>\``,
                            ].join("\n"),
                          ),
                      ],
                    });

                  const fileName = image.name || "";
                  const fileExtension = fileName.split(".").pop();

                  if (fileExtension?.toLowerCase() !== "png") {
                    await interaction.reply({
                      embeds: [
                        new ErrorEmbed()
                          .setColor("Red")
                          .setDescription(
                            [
                              `${client.getEmoji(interaction.guild.id, "error")} The file must be in PNG format.`,
                              `\`Example:\` \`/config card-background --image <image.png>\``,
                            ].join("\n"),
                          ),
                      ],
                    });

                    return;
                  }

                  const targetMember = interaction.member;
                  await main.prisma.userLevel.updateMany({
                    where: {
                      guildId: interaction.guild.id,
                      userId: interaction.user.id,
                    },
                    data: {
                      background: image.url,
                    },
                  });

                  const Buffer = await Profile(targetMember.user.id, {
                    customBackground: image.url,
                  });

                  const Attachment = new AttachmentBuilder(Buffer, {
                    name: "profile.png",
                  });
                  await interaction.reply({
                    embeds: [
                      new EmbedCorrect()
                        .setColor("Green")
                        .setDescription(
                          [
                            `${client.getEmoji(interaction.guild.id, "correct")} The background image has been updated successfully.`,
                            `\`Example:\` \`/config card-background --image <image.png>\``,
                          ].join("\n"),
                        )
                        .setImage(`attachment://profile.png`),
                    ],
                    files: [Attachment],
                  });
                } catch (err) {
                  console.error(err);
                }
              }
              break;
            case "card-barcolor":
              {
                try {
                  const color = interaction.options.getString("color");
                  if (!color) return;

                  const colorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
                  if (!color.match(colorRegex)) {
                    await interaction.reply({
                      embeds: [
                        new ErrorEmbed()
                          .setColor("Red")
                          .setDescription(
                            [
                              `${client.getEmoji(interaction.guild.id, "error")} The color must be in HEX format.`,
                              `\`Example:\` \`/config card-barcolor --color #FF0000\``,
                            ].join("\n"),
                          ),
                      ],
                    });
                    return;
                  }

                  const targetMember = interaction.member;
                  const user = await main.prisma.userLevel.findFirst({
                    where: {
                      guildId: interaction.guild.id,
                      userId: interaction.user.id,
                    },
                  });

                  if (!user) {
                    await interaction.reply({
                      embeds: [
                        new ErrorEmbed()
                          .setColor("Red")
                          .setDescription(
                            [
                              `${client.getEmoji(interaction.guild.id, "error")} You must set a background image first.`,
                              `\`Example:\` \`/config card-background --image <image.png>\``,
                            ].join("\n"),
                          ),
                      ],
                    });
                    return;
                  }
                  const background = user?.background;
                  const borderColor = user?.borderColor;
                  const backgroundBlur = user?.blur;

                  const buffer = await Profile(targetMember.user.id, {
                    customBackground: background as string,
                    borderColor: borderColor as string,
                    moreBackgroundBlur: !!backgroundBlur,
                    rankData: {
                      currentXp: user.xp || 0,
                      requiredXp: user.level * 100 || 0,
                      level: user.level || 0,
                      barColor: color,
                    },
                  });

                  const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });
                  await interaction.reply({
                    embeds: [
                      new EmbedCorrect()
                        .setColor("Green")
                        .setDescription(
                          [
                            `${client.getEmoji(interaction.guild.id, "correct")} The bar color has been updated successfully.`,
                            `\`Example:\` \`/config card-barcolor --color #FF0000\``,
                          ].join("\n"),
                        )
                        .setImage(`attachment://profile.png`),
                    ],
                    files: [attachment],
                  });

                  await main.prisma.userLevel.updateMany({
                    where: {
                      guildId: interaction.guild.id,
                      userId: interaction.user.id,
                    },
                    data: {
                      barColor: color,
                    },
                  });
                } catch (err) {
                  console.error(err);
                }
              }
              break;
            case "card-blur":
              {
                try {
                  const blur = interaction.options.getNumber("value");
                  if (!blur) return;

                  const targetMember: GuildMember =
                    (interaction.options.getMember("member") as GuildMember) || interaction.member;

                  await main.prisma.userLevel.updateMany({
                    where: {
                      guildId: interaction.guild.id,
                      userId: targetMember.user.id,
                    },
                    data: {
                      blur: Math.min(10, Math.max(0, blur)),
                    },
                  });

                  const user = await main.prisma.userLevel.findFirst({
                    where: {
                      guildId: interaction.guild.id,
                      userId: targetMember.user.id,
                    },
                  });

                  if (!user) {
                    return await interaction.reply({
                      embeds: [
                        new ErrorEmbed()
                          .setColor("Red")
                          .setDescription(
                            [
                              `${client.getEmoji(interaction.guild.id, "error")} The user has not set a background image yet.`,
                              `\`Example:\` \`/config card-background --image <image.png>\``,
                            ].join("\n"),
                          ),
                      ],
                    });
                  }

                  const background = user.background;
                  const barColor = user.barColor;
                  const borderColor = user.borderColor;

                  const buffer = await Profile(targetMember.id, {
                    borderColor: borderColor as string,
                    presenceStatus: targetMember.presence?.status,
                    customBackground: background as string,
                    moreBackgroundBlur: !!blur,
                    rankData: {
                      currentXp: user.xp,
                      requiredXp: user.level * 100,
                      level: user.level,
                      barColor: barColor as string,
                    },
                  });

                  const attachment = new AttachmentBuilder(buffer, {
                    name: "profile.png",
                  });

                  await interaction.reply({
                    embeds: [
                      new EmbedCorrect()
                        .setColor("Green")
                        .setDescription(
                          [
                            `${client.getEmoji(interaction.guild.id, "correct")} The blur value has been updated successfully.`,
                            `\`Example:\` \`/config card-blur --value 5\``,
                          ].join("\n"),
                        )
                        .setImage(`attachment://profile.png`),
                    ],
                    files: [attachment],
                  });
                } catch (error) {
                  console.error(error);
                }
              }
              break;
            case "card-bordercolor":
              {
                try {
                  const color = interaction.options.getString("color");
                  if (!color) return;
                  const colorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
                  if (!color.match(colorRegex)) {
                    await interaction.reply({
                      embeds: [
                        new ErrorEmbed()
                          .setColor("Red")
                          .setDescription(
                            [
                              `${client.getEmoji(interaction.guild.id, "error")} The color must be in HEX format.`,
                              `\`Example:\` \`/config card-bordercolor --color #FF0000\``,
                            ].join("\n"),
                          ),
                      ],
                    });
                    return;
                  }

                  const targetMember = interaction.member;
                  const user = await main.prisma.userLevel.findFirst({
                    where: {
                      guildId: interaction.guild.id,
                      userId: targetMember.user.id,
                    },
                  });

                  if (!user) {
                    await interaction.reply({
                      embeds: [
                        new ErrorEmbed()
                          .setColor("Red")
                          .setDescription(
                            [
                              `${client.getEmoji(interaction.guild.id, "error")} You must set a background image first.`,
                              `\`Example:\` \`/config card-background --image <image.png>\``,
                            ].join("\n"),
                          ),
                      ],
                    });
                    return;
                  }
                  const background = user.background;
                  const backgroundBlur = user.blur;
                  const barColor = user.barColor;

                  const buffer = await Profile(targetMember.user.id, {
                    customBackground: background as string,
                    borderColor: color,
                    moreBackgroundBlur: !!backgroundBlur,
                    rankData: {
                      currentXp: user.xp,
                      requiredXp: user.level * 100,
                      level: user.level,
                      barColor: barColor as string,
                    },
                  });

                  const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });
                  await interaction.reply({
                    embeds: [
                      new EmbedCorrect()
                        .setColor("Green")
                        .setDescription(
                          [
                            `${client.getEmoji(interaction.guild.id, "correct")} The border color has been updated successfully.`,
                            `\`Example:\` \`/config card-bordercolor --color #FF0000\``,
                          ].join("\n"),
                        )
                        .setImage(`attachment://profile.png`),
                    ],
                    files: [attachment],
                  });

                  await main.prisma.userLevel.updateMany({
                    where: {
                      guildId: interaction.guild.id,
                      userId: targetMember.user.id,
                    },
                    data: {
                      borderColor: color,
                    },
                  });
                } catch (err) {
                  console.error(err);
                }
              }
              break;
          }
        }
        break;
      case "ranking-notify":
        {
          const subcommand = interaction.options.getSubcommand();
          switch (subcommand) {
            case "set":
              {
                const channel = interaction.options.getChannel("channel");
                if (!channel) return;
                const guildId = interaction.guild.id;
                const existingConfig = await main.prisma.levelConfig.findFirst({
                  where: { guildId: guildId },
                });

                if (existingConfig) {
                  await main.prisma.levelConfig.update({
                    where: { id: existingConfig.id },
                    data: { channelId: channel.id },
                  });
                  await interaction.reply({
                    embeds: [
                      new EmbedCorrect()
                        .setColor("#087996")
                        .setDescription(
                          [
                            `${client.getEmoji(interaction.guild.id, "correct")} Notification channel updated to ${channel}.`,
                            `> **Channel:** ${channel} (\`${channel.id}\`)`,
                          ].join("\n"),
                        ),
                    ],
                  });
                } else {
                  await main.prisma.levelConfig.create({
                    data: {
                      guildId: guildId,
                      channelId: channel.id,
                      status: true,
                    },
                  });

                  await interaction.reply({
                    embeds: [
                      new EmbedCorrect()
                        .setColor("#087996")
                        .setDescription(
                          [
                            `${client.getEmoji(interaction.guild.id, "correct")} Notification channel updated to ${channel}.`,
                            `> **Channel:** ${channel} (\`${channel.id}\`)`,
                          ].join("\n"),
                        ),
                    ],
                  });
                }
              }
              break;
            case "remove":
              {
                const guildId = interaction.guild.id;

                const updatedConfig = await main.prisma.levelConfig.updateMany({
                  where: { guildId: guildId },
                  data: { channelId: null },
                });

                if (updatedConfig) {
                  await interaction.reply({
                    embeds: [
                      new EmbedCorrect()
                        .setColor("#087996")
                        .setDescription(
                          [
                            `${client.getEmoji(interaction.guild.id, "correct")} Notification channel removed.`,
                            `> **Channel:** None`,
                          ].join("\n"),
                        ),
                    ],
                  });
                } else {
                  await interaction.reply({
                    embeds: [
                      new ErrorEmbed()
                        .setColor("Red")
                        .setDescription(
                          [
                            `${client.getEmoji(interaction.guild.id, "error")} The notification channel could not be removed.`,
                            `> **Channel:** None`,
                          ].join("\n"),
                        ),
                    ],
                  });
                }
              }
              break;
          }
        }
        break;
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "use") {
      const status = interaction.options.getBoolean("status");
      if (status === null) {
        return await interaction.reply({
          embeds: [
            new ErrorEmbed()
              .setColor("Red")
              .setDescription(`${client.getEmoji(interaction.guild.id, "error")} You must provide a status.`),
          ],
        });
      }

      const guildId = interaction.guild.id;
      const existingConfig = await main.prisma.levelConfig.findFirst({
        where: { guildId: guildId },
      });

      if (existingConfig) {
        await main.prisma.levelConfig.update({
          where: { id: existingConfig.id },
          data: { status: status },
        });
      } else {
        await main.prisma.levelConfig.create({
          data: {
            guildId: guildId,
            channelId: null,
            status: status,
          },
        });
      }

      await interaction.reply({
        embeds: [
          new EmbedCorrect()
            .setColor("#087996")
            .setDescription(
              `${client.getEmoji(interaction.guild.id, "correct")} The ranking system has been ${status ? "enabled" : "disabled"}.`,
            ),
        ],
      });
    }
    return;
  },
);
