import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";
import { Precommand } from "@typings/modules";

const roomsCommand: Precommand = {
  name: "rooms",
  description: "Create a voice channel rooms config system",
  examples: ["rooms enabled <channel_id>"],
  nsfw: false,
  owner: false,
  cooldown: 10,
  aliases: ["room"],
  botpermissions: ["ManageChannels"],
  permissions: ["Administrator"],
  subcommands: ["rooms enabled <channel_id>"],
  async execute(client, message, args, prefix) {
    if (!message.guild || message.channel.type !== ChannelType.GuildText) return;
    const subcommands = args[0];
    switch (subcommands) {
      case "enabled":
        {
          const data = await main.prisma.myGuild.findUnique({
            where: { id: message.guild.id },
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

          await message.channel.send({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                new ChannelSelectMenuBuilder()
                  .setCustomId("rooms:menu-config")
                  .setPlaceholder("Select a channel voice")
                  .setChannelTypes(ChannelType.GuildVoice)
                  .setMaxValues(1),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel("Go back")
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji(client.getEmoji(message.guild.id, "circle_x"))
                  .setCustomId("manager_systems_back"),
              ),
            ],
          });
        }
        break;
      default:
        {
          const data = await main.prisma.myGuild.findUnique({
            where: { id: message.guild.id },
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
          message.channel.send({
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
                  .setLabel("rooms:button-disabled")
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji(client.getEmoji(message.guild.id, "circle_x"))
                  .setCustomId("rooms disabled"),
              ),
            ],
          });
        }
        break;
    }

    return;
  },
};
export = roomsCommand;
