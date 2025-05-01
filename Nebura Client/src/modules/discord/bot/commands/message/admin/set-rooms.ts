import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";
import { Precommand } from "@typings/modules/discord";

const roomsCommand: Precommand = {
  name: "rooms",
  description: "Create a voice channel rooms config system",
  examples: ["rooms enabled"],
  nsfw: false,
  owner: false,
  cooldown: 10,
  aliases: ["room"],
  botpermissions: ["ManageChannels"],
  permissions: ["Administrator"],
  subcommands: ["rooms enabled <channel_id>", "rooms disabled"],
  async execute(client, message, args, prefix) {
    if (!message.guild || message.channel.type !== ChannelType.GuildText) return;
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
                  .setTitle("Error Rooms - Systems")
                  .setDescription(
                    [
                      `${client.getEmoji(
                        message.guild.id,
                        "error",
                      )} An error occurred while trying to enable the rooms system.`,
                      `Please try again later or contact the support team.`,
                    ].join("\n"),
                  ),
              ],
            });

          const embed = new EmbedCorrect()
            .setTitle("Rooms System - Enabled")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "correct")} You are in the voice room system configuration menu now.`,
                `Please select the channel where you want to create the rooms.`,
                `**Current Channel:** ${data.rooms ? `<#${data.rooms}>` : "Not set"}`,
              ].join("\n"),
            );

          const msg = await message.channel.send({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                new ChannelSelectMenuBuilder()
                  .setCustomId("rooms-menu-config")
                  .setPlaceholder("Select a voice channel")
                  .setChannelTypes(ChannelType.GuildVoice)
                  .setMaxValues(1),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel("Confirm Selection")
                  .setStyle(ButtonStyle.Success)
                  .setEmoji(client.getEmoji(message.guild.id, "circle_check"))
                  .setCustomId("rooms-confirm-selection"),
                new ButtonBuilder()
                  .setLabel("Cancel")
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
                        `${client.getEmoji(message.guild.id, "error")} Please select a valid voice channel.`,
                        `The selected channel must be a voice channel.`,
                      ].join("\n"),
                    ),
                  ],
                  ephemeral: true,
                });
              }

              await main.prisma.myGuild.update({
                where: { guildId: message.guild.id },
                data: { rooms: selectedChannel },
              });

              await interaction.update({
                embeds: [
                  new EmbedCorrect().setDescription(
                    [
                      `${client.getEmoji(message.guild.id, "correct")} The rooms system has been successfully enabled.`,
                      `• **Usage:** \`${prefix}rooms disabled\` to disable the system.`,
                    ].join("\n"),
                  ),
                ],
                components: [],
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
                              `${client.getEmoji(message.guild.id, "correct")} The rooms system configuration has been canceled.`,
                              `• **Usage:** \`${prefix}rooms enabled <channel_id>\` to re-enable the system.`,
                            ].join("\n"),
                          )
                          .setTitle("Rooms System - Canceled"),
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
            .setTitle("Rooms System - Disabled")
            .setDescription([
              `${client.getEmoji(
                message.guild.id,
                "correct",
              )} The rooms system has been successfully disabled.`,
              `• **Usage:** \`${prefix}rooms enabled <channel_id>\` to re-enable the system.`,
            ].join("\n"))

          const msg = await message.channel.send({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel("Re-enable")
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
                    const channel = data.rooms
                      ? message.guild.channels.cache.get(data.rooms as string)
                      : null;
                    await interaction.editReply({
                      embeds: [
                        new EmbedCorrect()
                          .setTitle("Rooms System - Re-enabled")
                          .setDescription(
                            [
                              `${client.getEmoji(
                                message.guild.id,
                                "correct",
                              )} The rooms system has been successfully re-enabled.`,
                              `**Current Channel:** ${channel ? channel.toString() : "Not set"}`,
                              `**Usage:**`,
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
                  .setTitle("Error Rooms - Systems")
                  .setDescription(
                    [
                      `${client.getEmoji(
                        message.guild.id,
                        "error",
                      )} An error occurred while trying to fetch the rooms system data.`,
                      `Please try again later or contact the support team.`,
                    ].join("\n"),
                  ),
              ],
            });

          const channel = data.rooms
            ? message.guild.channels.cache.get(data.rooms as string)
            : null;
          const msg = await message.channel.send({
            embeds: [
              new EmbedCorrect()
                .setTitle("Rooms System - Configuration")
                .setDescription(
                  [
                    `**Status:** ${data.rooms === null ? "Disabled" : "Enabled"}`,
                    `**Channel:** ${channel ? channel.toString() : "Not set"}`,
                    `**Usage:**`,
                    `• \`${prefix}rooms enabled <channel_id>\``,
                    `• \`${prefix}rooms disabled\``,
                  ].join("\n"),
                ),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel("Disable System")
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji(client.getEmoji(message.guild.id, "circle_x"))
                  .setCustomId("rooms-disabled"),
                new ButtonBuilder()
                  .setLabel("Modify Channel")
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
                          .setTitle("Rooms System - Disabled")
                          .setDescription(
                            `${client.getEmoji(
                              message.guild.id,
                              "correct",
                            )} The rooms system has been successfully disabled.`,
                          ),
                      ],
                      components: [],
                    });
                  }
                  break;
                case "rooms-modify-channel":
                  {
                    await interaction.deferUpdate();
                    const channel = data.rooms
                      ? message.guild.channels.cache.get(data.rooms as string)
                      : null;
                    await msg.edit({
                      embeds: [
                        new EmbedCorrect()
                          .setTitle("Rooms System - Modify Channel")
                          .setDescription(
                            [
                              `${client.getEmoji(
                                message.guild.id,
                                "correct",
                              )} You are in the voice room system configuration menu now.`,
                              `Please select the channel where you want to create the rooms.`,
                              `**Current Channel:** ${channel ? channel.toString() : "Not set"}`,
                            ].join("\n"),
                          ),
                      ],
                      components: [
                        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                          new ChannelSelectMenuBuilder()
                            .setCustomId("rooms-menu-config")
                            .setPlaceholder("Select a voice channel")
                            .setChannelTypes(ChannelType.GuildVoice)
                            .setMaxValues(1),
                        ),
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                          new ButtonBuilder()
                            .setLabel("Confirm Selection")
                            .setStyle(ButtonStyle.Success)
                            .setEmoji(client.getEmoji(message.guild.id, "circle_check"))
                            .setCustomId("rooms-confirm-selection"),
                          new ButtonBuilder()
                            .setLabel("Cancel")
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
export = roomsCommand;
