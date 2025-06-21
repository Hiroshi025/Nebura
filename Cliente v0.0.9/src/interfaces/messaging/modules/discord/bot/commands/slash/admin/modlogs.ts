import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/embeds.extend";

export default new Command(
  new SlashCommandBuilder()
    .setName("modlogs")
    .setNameLocalizations({
      "es-ES": "modlogs",
    })
    .setDescription("Setup or edit the modlogs.")
    .setDescriptionLocalizations({
      "es-ES": "Configura o edita los modlogs.",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setNameLocalizations({
          "es-ES": "configurar",
        })
        .setDescription("Setup the modlogs.")
        .setDescriptionLocalizations({
          "es-ES": "Configura los modlogs.",
        })
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setNameLocalizations({
              "es-ES": "canal",
            })
            .setDescription("Channel to send the message to.")
            .setDescriptionLocalizations({
              "es-ES": "Canal para enviar el mensaje.",
            })
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("replace_channel")
        .setNameLocalizations({
          "es-ES": "reemplazar",
        })
        .setDescription("Replace the channel for the modlogs.")
        .setDescriptionLocalizations({
          "es-ES": "Reemplaza el canal para los modlogs.",
        })
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setNameLocalizations({
              "es-ES": "canal",
            })
            .setDescription("Channel to send the message to.")
            .setDescriptionLocalizations({
              "es-ES": "Canal para enviar el mensaje.",
            })
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("delete").setDescription("Deletes config for the modlogs."),
    ),
  async (client, interaction) => {
    const getSubCommand = interaction.options.getSubcommand();

    switch (getSubCommand) {
      case "setup": {
        const { options, guild } = interaction;
        const channel = options.getChannel("channel");

        if (!guild || !channel)
          return interaction.reply({
            embeds: [
              new ErrorEmbed()
                .setTitle("Error Modlogs")
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string, "error")} You need to specify a channel for the modlogs!`,
                    `Please make sure that the channel is a text channel.`,
                  ].join("\n"),
                ),
            ],
          });

        const existingModlog = await main.prisma.serverModlog.findFirst({
          where: { guildId: guild.id },
        });

        if (existingModlog) {
          interaction.reply({
            content: "Modlogs are already setup!",
            flags: "Ephemeral",
          });
          return;
        }

        await main.prisma.serverModlog.create({
          data: {
            guildId: guild.id,
            channelId: channel.id,
          },
        });

        await interaction.reply({
          embeds: [
            new EmbedCorrect()
              .setTitle("Modlogs setup!")
              .setDescription(`Modlogs have been successfully setup in <#${channel.id}>`)
              .setColor(0x00ff00),
          ],
          flags: "Ephemeral",
        });
        break;
      }

      case "replace_channel": {
        const { options, guild } = interaction;
        const channel = options.getChannel("channel");

        if (!guild || !channel)
          return interaction.reply({
            embeds: [
              new ErrorEmbed()
                .setTitle("Error Modlogs")
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string, "error")} You need to specify a channel for the modlogs!`,
                    `Please make sure that the channel is a text channel.`,
                  ].join("\n"),
                ),
            ],
          });

        const existingModlog = await main.prisma.serverModlog.findFirst({
          where: { guildId: guild.id },
        });

        if (!existingModlog) {
          interaction.reply({
            content: "Modlogs not setup! To setup run `/modlogs setup`",
            flags: "Ephemeral",
          });
          return;
        }

        await main.prisma.serverModlog.update({
          where: { guildId: guild.id }, // Cambiado de id: existingModlog.id a guildId: guild.id
          data: { channelId: channel.id },
        });

        await interaction.reply({
          embeds: [
            new EmbedCorrect()
              .setTitle("Modlogs channel replaced!")
              .setDescription(`Modlogs channel has been successfully replaced in <#${channel.id}>`)
              .setColor(0x00ff00),
          ],
          flags: "Ephemeral",
        });
        break;
      }

      case "delete": {
        const { guild } = interaction;

        if (!guild)
          return interaction.reply({
            embeds: [
              new ErrorEmbed()
                .setTitle("Error Modlogs")
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string, "error")} You need to specify a channel for the modlogs!`,
                    `Please make sure that the channel is a text channel.`,
                  ].join("\n"),
                ),
            ],
          });

        const existingModlog = await main.prisma.serverModlog.findFirst({
          where: { guildId: guild.id },
        });

        if (!existingModlog) {
          interaction.reply({
            content: "Modlogs not setup! To setup run `/modlogs setup`",
            flags: "Ephemeral",
          });
          return;
        }

        await main.prisma.serverModlog.delete({
          where: { guildId: guild.id }, // Cambiado de id: existingModlog.id a guildId: guild.id
        });

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Modlogs deleted!")
              .setDescription(`Modlogs have been successfully deleted!`)
              .setColor(0x00ff00),
          ],
          flags: "Ephemeral",
        });
        break;
      }

      default:
        break;
    }

    return;
  },
);
