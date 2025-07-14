import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const roomsCommand: Precommand = {
  name: "rooms",
  nameLocalizations: {
    "es-ES": "salas",
    "en-US": "rooms",
  },
  description: "Create a voice channel rooms config system",
  descriptionLocalizations: {
    "es-ES": "Crea un sistema de configuración de salas de voz",
    "en-US": "Create a voice channel rooms config system",
  },
  examples: ["rooms enabled"],
  nsfw: false,
  owner: false,
  cooldown: 10,
  category: "Configuration",
  aliases: ["room"],
  botpermissions: ["ManageChannels"],
  permissions: ["Administrator"],
  subcommands: ["rooms enabled <channel_id>", "rooms disabled"],
  async execute(client, message, args, prefix) {
    if (!message.guild || message.channel.type !== ChannelType.GuildText) return;
    // Detecta idioma del servidor o usa "es-ES" por defecto
    const lang = message.guild?.preferredLocale || "es-ES";
    const subcommands = args[0];
    switch (subcommands) {
      case "enabled":
        {
          const data = await main.prisma.myGuild.findUnique({
            where: { guildId: message.guild.id },
          });

          if (!data)
            return message.channel.send({
              embeds: [
                new ErrorEmbed()
                  .setTitle(client.t("discord:rooms.errorTitle", { lng: lang }))
                  .setDescription(
                    [
                      `${client.getEmoji(
                        message.guild.id,
                        "error",
                      )} ${client.t("discord:rooms.errorEnable", { lng: lang })}`,
                      client.t("discord:rooms.tryAgain", { lng: lang }),
                    ].join("\n"),
                  ),
              ],
            });

          const embed = new EmbedCorrect()
            .setTitle(client.t("discord:rooms.enabledTitle", { lng: lang }))
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "correct")} ${client.t("discord:rooms.enabledDesc", { lng: lang })}`,
                client.t("discord:rooms.selectChannel", { lng: lang }),
                client.t("discord:rooms.currentChannel", {
                  lng: lang,
                  channel: data.rooms ? `<#${data.rooms}>` : client.t("discord:rooms.notSet", { lng: lang }),
                }),
                client.t("discord:rooms.note", { lng: lang }),
              ].join("\n"),
            );

          const msg = await message.channel.send({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                new ChannelSelectMenuBuilder()
                  .setCustomId("rooms-menu-config")
                  .setPlaceholder(client.t("discord:rooms.selectChannelPlaceholder", { lng: lang }))
                  .setChannelTypes(ChannelType.GuildVoice)
                  .setMaxValues(1),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel(client.t("discord:rooms.confirmSelection", { lng: lang }))
                  .setStyle(ButtonStyle.Success)
                  .setEmoji(client.getEmoji(message.guild.id, "circle_check"))
                  .setCustomId("rooms-confirm-selection"),
                new ButtonBuilder()
                  .setLabel(client.t("discord:rooms.cancel", { lng: lang }))
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji(client.getEmoji(message.guild.id, "circle_x"))
                  .setCustomId("rooms-cancel-selection"),
              ),
            ],
          });

          const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60000,
          });

          collector.on("collect", async (interaction) => {
            if (!message.guild || !message.channel || !client.user) return;
            if (interaction.isChannelSelectMenu()) {
              const selectedChannel = interaction.values[0];
              const channel = message.guild.channels.cache.get(selectedChannel);
              if (!channel || channel.type !== ChannelType.GuildVoice) {
                return interaction.reply({
                  embeds: [
                    new ErrorEmbed().setDescription(
                      [
                        `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:rooms.invalidChannel", { lng: lang })}`,
                        client.t("discord:rooms.mustBeVoice", { lng: lang }),
                      ].join("\n"),
                    ),
                  ],
                  flags: "Ephemeral",
                });
              }

              await main.prisma.myGuild.update({
                where: { guildId: message.guild.id },
                data: { rooms: selectedChannel },
              });

              await interaction
                .update({
                  embeds: [
                    new EmbedCorrect().setDescription(
                      [
                        `${client.getEmoji(message.guild.id, "correct")} ${client.t("discord:rooms.successEnabled", { lng: lang, emoji: client.getEmoji(message.guild.id, "correct") })}`,
                        client.t("discord:rooms.usageDisable", { lng: lang, prefix }),
                      ].join("\n"),
                    ),
                  ],
                  components: [],
                })
                .then(async () => {
                  const category = await message.guild?.channels.create({
                    name: "Rooms",
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                      {
                        id: message.guild.roles.everyone.id,
                        deny: ["ViewChannel"],
                      },
                      {
                        id: client.user?.id || "",
                        allow: ["ViewChannel", "SendMessages", "Connect", "Speak"],
                      },
                    ],
                  });

                  await main.prisma.myGuild.update({
                    where: { guildId: message.guild?.id },
                    data: { roomcategory: category?.id },
                  });
                });
            } else if (interaction.isButton()) {
              switch (interaction.customId) {
                case "rooms-confirm-selection":
                  {
                    await interaction.deferUpdate();
                  }
                  break;
                case "rooms-cancel-selection":
                  {
                    await interaction.update({
                      embeds: [
                        new EmbedCorrect()
                          .setDescription(
                            [
                              `${client.getEmoji(message.guild.id, "correct")} ${client.t("discord:rooms.canceled", { lng: lang, emoji: client.getEmoji(message.guild.id, "correct") })}`,
                              client.t("discord:rooms.usageEnable", { lng: lang, prefix }),
                            ].join("\n"),
                          )
                          .setTitle(client.t("discord:rooms.canceledTitle", { lng: lang })),
                      ],
                      components: [],
                    });
                  }
                  break;
              }
            }

            return;
          });
        }
        break;
      case "disabled":
        {
          const data = await main.prisma.myGuild.update({
            where: { guildId: message.guild.id },
            data: { rooms: null },
          });

          const embed = new EmbedCorrect()
            .setTitle(client.t("discord:rooms.disabledTitle", { lng: lang }))
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "correct")} ${client.t("discord:rooms.successDisabled", { lng: lang, emoji: client.getEmoji(message.guild.id, "correct") })}`,
                client.t("discord:rooms.usageEnable", { lng: lang, prefix }),
              ].join("\n"),
            );

          const msg = await message.channel.send({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel(client.t("discord:rooms.reenable", { lng: lang }))
                  .setStyle(ButtonStyle.Primary)
                  .setEmoji(client.getEmoji(message.guild.id, "reply"))
                  .setCustomId("rooms-reenable"),
              ),
            ],
          });

          const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60000,
          });

          collector.on("collect", async (interaction) => {
            if (!message.guild || !message.channel || !client.user) return;
            if (interaction.isButton()) {
              switch (interaction.customId) {
                case "rooms-reenable":
                  {
                    await interaction.deferUpdate();
                    const channel = data.rooms ? message.guild.channels.cache.get(data.rooms as string) : null;
                    await interaction.editReply({
                      embeds: [
                        new EmbedCorrect()
                          .setTitle(client.t("discord:rooms.reenabledTitle", { lng: lang }))
                          .setDescription(
                            [
                              `${client.getEmoji(
                                message.guild.id,
                                "correct",
                              )} ${client.t("discord:rooms.successReenabled", { lng: lang, emoji: client.getEmoji(message.guild.id, "correct") })}`,
                              client.t("discord:rooms.currentChannel", {
                                lng: lang,
                                channel: channel ? channel.toString() : client.t("discord:rooms.notSet", { lng: lang }),
                              }),
                              `**${client.t("discord:rooms.usage", { lng: lang })}**`,
                              `• \`${prefix}rooms enabled <channel_id>\``,
                            ].join("\n"),
                          ),
                      ],
                      components: [],
                    });
                  }
                  break;
              }
            }
          });
        }
        break;
      default:
        {
          const data = await main.prisma.myGuild.findFirst({
            where: { guildId: message.guild.id },
          });
          if (!data)
            return message.channel.send({
              embeds: [
                new ErrorEmbed()
                  .setTitle(client.t("discord:rooms.errorTitle", { lng: lang }))
                  .setDescription(
                    [
                      `${client.getEmoji(
                        message.guild.id,
                        "error",
                      )} ${client.t("discord:rooms.errorFetch", { lng: lang })}`,
                      client.t("discord:rooms.tryAgain", { lng: lang }),
                    ].join("\n"),
                  ),
              ],
            });

          const channel = data.rooms ? message.guild.channels.cache.get(data.rooms as string) : null;
          const msg = await message.channel.send({
            embeds: [
              new EmbedCorrect().setTitle(client.t("discord:rooms.configurationTitle", { lng: lang })).setDescription(
                client.t("discord:rooms.configurationDesc", {
                  lng: lang,
                  status:
                    data.rooms === null
                      ? client.t("discord:common.disabled", { lng: lang })
                      : client.t("discord:common.enabled", { lng: lang }),
                  channel: channel ? channel.toString() : client.t("discord:rooms.notSet", { lng: lang }),
                  prefix,
                }),
              ),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel(client.t("discord:rooms.disableSystem", { lng: lang }))
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji(client.getEmoji(message.guild.id, "circle_x"))
                  .setCustomId("rooms-disabled"),
                new ButtonBuilder()
                  .setLabel(client.t("discord:rooms.modifyChannel", { lng: lang }))
                  .setStyle(ButtonStyle.Primary)
                  .setEmoji(client.getEmoji(message.guild.id, "file"))
                  .setCustomId("rooms-modify-channel"),
              ),
            ],
          });

          const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60000,
          });

          collector.on("collect", async (interaction) => {
            if (!message.guild || !message.channel || !client.user) return;
            if (interaction.isButton()) {
              switch (interaction.customId) {
                case "rooms-disabled":
                  {
                    await interaction.deferUpdate();
                    await main.prisma.myGuild.update({
                      where: { guildId: message.guild.id },
                      data: { rooms: null },
                    });
                    await msg.edit({
                      embeds: [
                        new EmbedCorrect()
                          .setTitle(client.t("discord:rooms.disabledTitle", { lng: lang }))
                          .setDescription(
                            `${client.getEmoji(
                              message.guild.id,
                              "correct",
                            )} ${client.t("discord:rooms.successDisabled", { lng: lang, emoji: client.getEmoji(message.guild.id, "correct") })}`,
                          ),
                      ],
                      components: [],
                    });
                  }
                  break;
                case "rooms-modify-channel":
                  {
                    await interaction.deferUpdate();
                    const channel = data.rooms ? message.guild.channels.cache.get(data.rooms as string) : null;
                    await msg.edit({
                      embeds: [
                        new EmbedCorrect()
                          .setTitle(client.t("discord:rooms.modifyTitle", { lng: lang }))
                          .setDescription(
                            client.t("discord:rooms.modifyDesc", {
                              lng: lang,
                              emoji: client.getEmoji(message.guild.id, "correct"),
                              channel: channel ? channel.toString() : client.t("discord:rooms.notSet", { lng: lang }),
                            }),
                          ),
                      ],
                      components: [
                        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                          new ChannelSelectMenuBuilder()
                            .setCustomId("rooms-menu-config")
                            .setPlaceholder(client.t("discord:rooms.selectChannelPlaceholder", { lng: lang }))
                            .setChannelTypes(ChannelType.GuildVoice)
                            .setMaxValues(1),
                        ),
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                          new ButtonBuilder()
                            .setLabel(client.t("discord:rooms.confirmSelection", { lng: lang }))
                            .setStyle(ButtonStyle.Success)
                            .setEmoji(client.getEmoji(message.guild.id, "circle_check"))
                            .setCustomId("rooms-confirm-selection"),
                          new ButtonBuilder()
                            .setLabel(client.t("discord:rooms.cancel", { lng: lang }))
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji(client.getEmoji(message.guild.id, "circle_x"))
                            .setCustomId("rooms-cancel-selection"),
                        ),
                      ],
                    });
                  }
                  break;
              }
            }
          });
        }
        break;
    }

    return;
  },
};
export default roomsCommand;
