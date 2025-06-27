import {
  ChannelType,
  EmbedBuilder,
  GuildMember,
  GuildMemberRoleManager,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  userMention,
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { ErrorEmbed } from "@utils/extenders/embeds.extend";
import { logWithLabel } from "@utils/functions/console";

export default new Command(
  new SlashCommandBuilder()
    .setName("ban")
    .setNameLocalizations({
      "es-ES": "banear",
    })
    .setDescription("Ban a member!")
    .setDescriptionLocalizations({
      "es-ES": "¡Banea a un miembro!",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setNameLocalizations({
          "es-ES": "usuario",
        })
        .setDescription("Ban a user!")
        .setDescriptionLocalizations({
          "es-ES": "¡Banea a un usuario!",
        })
        .addUserOption((option) =>
          option
            .setName("target")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setDescription("User to ban.")
            .setDescriptionLocalizations({
              "es-ES": "Usuario a banear.",
            })
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setNameLocalizations({
              "es-ES": "razón",
            })
            .setDescription("Reason for the ban.")
            .setDescriptionLocalizations({
              "es-ES": "Razón del baneo.",
            })
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setNameLocalizations({
          "es-ES": "configurar",
        })
        .setDescription("Setup the ban logs.")
        .setDescriptionLocalizations({
          "es-ES": "Configura los registros de baneos.",
        })
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setNameLocalizations({
              "es-ES": "canal",
            })
            .setDescription("Channel to send the message to.")
            .setDescriptionLocalizations({
              "es-ES": "Canal donde enviar el mensaje.",
            })
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    ),

  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || interaction.user.bot || !client.user) return;
    await interaction.deferReply({ flags: "Ephemeral" });

    const subcommand = interaction.options.getSubcommand();
    const embed = new EmbedBuilder();

    // Validación de permisos del usuario ejecutor
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
      return interaction.followUp({
        embeds: [embed.setColor("Red").setDescription("You do not have permission to ban members.")],
      });
    }

    switch (subcommand) {
      case "user": {
        const { options, guild, member } = interaction;
        const target: GuildMember = options.getMember("target") as GuildMember;

        if (!target || !member || !guild) {
          return interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setTitle("Ban Command Error")
                .setDescription(
                  `${client.getEmoji(interaction.guild.id, "error")} Invalid parameters. Please provide valid data.`,
                ),
            ],
          });
        }

        const reason = options.getString("reason") || "No reason provided.";
        try {
          await target.user.fetch();
        } catch (err: any) {
          logWithLabel("error", err);
          return interaction.followUp({
            embeds: [embed.setColor("Red").setDescription("Failed to fetch target user information.")],
          });
        }

        if (target.user.id === client.user.id) {
          return interaction.followUp({
            embeds: [embed.setColor("Red").setDescription("You cannot ban me!")],
          });
        }

        if (target.user.id === interaction.user.id) {
          return interaction.followUp({
            embeds: [embed.setColor("Yellow").setDescription("You cannot ban yourself.")],
          });
        }

        if (target.roles.highest.position >= (member.roles as GuildMemberRoleManager).highest.position) {
          return interaction.followUp({
            embeds: [
              embed.setColor("Red").setDescription("The member has a higher role than you, so you cannot ban them."),
            ],
          });
        }

        if (!guild.members.me?.permissions.has("BanMembers")) {
          return interaction.followUp({
            embeds: [embed.setColor("Red").setDescription("I do not have permission to ban members.")],
          });
        }

        const banSys = await main.prisma.banUser.findFirst({
          where: { guildId: guild.id },
        });
        if (!banSys) {
          return interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setTitle("Ban Command Error")
                .setDescription(
                  `${client.getEmoji(interaction.guild.id, "error")} Missing configuration. Please set up the ban logs channel using \`/ban setup\`.`,
                ),
            ],
          });
        }

        try {
          await main.prisma.banUser.create({
            data: {
              guildId: interaction.guild.id,
              userId: target.id,
              banReason: reason,
              banTime: new Date(),
            },
          });

          const modlog = await main.prisma.serverModlog.findFirst({ where: { guildId: guild.id } });
          if (modlog?.channelId) {
            const channelDB = guild.channels.cache.get(modlog.channelId);
            if (channelDB?.isTextBased()) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              (channelDB as TextChannel).send({
                embeds: [
                  new EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`User banned by ${userMention(member.user.id)}`)
                    .addFields(
                      { name: "Banned User", value: `<@${target.id}>` },
                      { name: "User ID", value: `${target.id}` },
                      { name: "Ban Date", value: `${new Date().toISOString()}` },
                      { name: "Reason", value: `\`\`\`${reason}\`\`\`` },
                    ),
                ],
              });
            }
          }

          const response = new EmbedBuilder()
            .setTitle("User successfully banned!")
            .setColor("Green")
            .setThumbnail(target.user.avatarURL({ forceStatic: true }))
            .addFields(
              { name: "ID", value: target.user.id },
              { name: "Reason", value: reason },
              {
                name: "Joined Server",
                value: target.joinedTimestamp
                  ? `<t:${parseInt((target.joinedTimestamp / 1000).toString())}:R>`
                  : "Unknown",
                inline: true,
              },
              {
                name: "Account Created",
                value: `<t:${parseInt((target.user.createdTimestamp / 1000).toString())}:R>`,
                inline: true,
              },
            );

          try {
            const targetDM = new EmbedBuilder()
              .setTitle(`You have been banned from the server: ${interaction.guild.name}!`)
              .setColor("Red")
              .setThumbnail(target.user.avatarURL({ forceStatic: true }))
              .addFields(
                { name: "ID", value: target.user.id },
                { name: "Reason", value: reason },
                {
                  name: "Joined Server",
                  value: target.joinedTimestamp
                    ? `<t:${parseInt((target.joinedTimestamp / 1000).toString())}:R>`
                    : "Unknown",
                  inline: true,
                },
              );
            await target.send({ embeds: [targetDM] });
          } catch (err: any) {
            logWithLabel("error", err);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await (interaction.channel as TextChannel).send({
              embeds: [
                embed
                  .setColor("Red")
                  .setDescription("Failed to send a direct message to the banned user. They might have DMs disabled."),
              ],
            });
          }

          await interaction.followUp({ embeds: [response] });
          await target.ban({ reason: reason });
        } catch (error: any) {
          logWithLabel("error", error);
          interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setTitle("Command Execution Error")
                .setDescription("An unexpected error occurred. Please try again."),
            ],
          });
        }
        break;
      }
      case "setup": {
        const channel = interaction.options.getChannel("channel");
        const { guild } = interaction;

        if (!channel) {
          return interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setTitle("Error Ban Command")
                .setDescription(`${client.getEmoji(interaction.guild.id, "error")} Please provide a valid channel.`),
            ],
          });
        }

        try {
          await main.prisma.serverModlog.upsert({
            where: { guildId: guild.id },
            update: { channelId: channel.id },
            create: { guildId: guild.id, channelId: channel.id },
          });

          const successEmbed = new EmbedBuilder()
            .setDescription(`${client.getEmoji(guild.id, "correct")} Ban logs are now enabled in <#${channel.id}>!`)
            .setColor("#00ff00");

          interaction.followUp({
            embeds: [successEmbed],
          });
        } catch (err: any) {
          logWithLabel("error", err);
          interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setTitle("Setup Error")
                .setDescription("An error occurred while setting up the ban logs."),
            ],
          });
        }
        break;
      }
    }

    return;
  },
);
