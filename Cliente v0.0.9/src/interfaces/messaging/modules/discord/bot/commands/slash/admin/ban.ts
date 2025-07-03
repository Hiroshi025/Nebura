import {
	ChannelType, EmbedBuilder, GuildMember, GuildMemberRoleManager, PermissionFlagsBits,
	SlashCommandBuilder, TextChannel, userMention
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { ErrorEmbed } from "@utils/extends/embeds.extension";
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

    const lang = interaction.locale || interaction.guildLocale || "en-US";
    const subcommand = interaction.options.getSubcommand();
    const embed = new EmbedBuilder();

    // Validación de permisos del usuario ejecutor
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
      return interaction.followUp({
        embeds: [embed.setColor("Red").setDescription(client.t("discord:ban.noPermission", { lng: lang }))],
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
                .setTitle(client.t("discord:ban.errorTitle", { lng: lang }))
                .setDescription(
                  `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:ban.invalidParams", { lng: lang })}`,
                ),
            ],
          });
        }

        const reason = options.getString("reason") || client.t("discord:ban.noReason", { lng: lang });
        try {
          await target.user.fetch();
        } catch (err: any) {
          logWithLabel("error", err);
          return interaction.followUp({
            embeds: [embed.setColor("Red").setDescription(client.t("discord:ban.fetchUserError", { lng: lang }))],
          });
        }

        if (target.user.id === client.user.id) {
          return interaction.followUp({
            embeds: [embed.setColor("Red").setDescription(client.t("discord:ban.cannotBanMe", { lng: lang }))],
          });
        }

        if (target.user.id === interaction.user.id) {
          return interaction.followUp({
            embeds: [embed.setColor("Yellow").setDescription(client.t("discord:ban.cannotBanSelf", { lng: lang }))],
          });
        }

        if (target.roles.highest.position >= (member.roles as GuildMemberRoleManager).highest.position) {
          return interaction.followUp({
            embeds: [embed.setColor("Red").setDescription(client.t("discord:ban.higherRole", { lng: lang }))],
          });
        }

        if (!guild.members.me?.permissions.has("BanMembers")) {
          return interaction.followUp({
            embeds: [embed.setColor("Red").setDescription(client.t("discord:ban.noBotPermission", { lng: lang }))],
          });
        }

        const banSys = await main.prisma.banUser.findFirst({
          where: { guildId: guild.id },
        });
        if (!banSys) {
          return interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setTitle(client.t("discord:ban.errorTitle", { lng: lang }))
                .setDescription(
                  `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:ban.noConfig", { lng: lang })}`,
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
                    .setTitle(
                      client.t("discord:ban.modlogTitle", { moderator: userMention(member.user.id), lng: lang }),
                    )
                    .addFields(
                      { name: client.t("discord:ban.modlogUser", { lng: lang }), value: `<@${target.id}>` },
                      { name: client.t("discord:ban.modlogUserId", { lng: lang }), value: `${target.id}` },
                      { name: client.t("discord:ban.modlogDate", { lng: lang }), value: `${new Date().toISOString()}` },
                      { name: client.t("discord:ban.modlogReason", { lng: lang }), value: `\`\`\`${reason}\`\`\`` },
                    ),
                ],
              });
            }
          }

          const response = new EmbedBuilder()
            .setTitle(client.t("discord:ban.successTitle", { lng: lang }))
            .setColor("Green")
            .setThumbnail(target.user.avatarURL({ forceStatic: true }))
            .addFields(
              { name: "ID", value: target.user.id },
              { name: client.t("discord:ban.reason", { lng: lang }), value: reason },
              {
                name: client.t("discord:ban.joinedServer", { lng: lang }),
                value: target.joinedTimestamp
                  ? `<t:${parseInt((target.joinedTimestamp / 1000).toString())}:R>`
                  : client.t("discord:ban.unknown", { lng: lang }),
                inline: true,
              },
              {
                name: client.t("discord:ban.accountCreated", { lng: lang }),
                value: `<t:${parseInt((target.user.createdTimestamp / 1000).toString())}:R>`,
                inline: true,
              },
            );

          try {
            const targetDM = new EmbedBuilder()
              .setTitle(client.t("discord:ban.dmTitle", { guild: interaction.guild.name, lng: lang }))
              .setColor("Red")
              .setThumbnail(target.user.avatarURL({ forceStatic: true }))
              .addFields(
                { name: "ID", value: target.user.id },
                { name: client.t("discord:ban.reason", { lng: lang }), value: reason },
                {
                  name: client.t("discord:ban.joinedServer", { lng: lang }),
                  value: target.joinedTimestamp
                    ? `<t:${parseInt((target.joinedTimestamp / 1000).toString())}:R>`
                    : client.t("discord:ban.unknown", { lng: lang }),
                  inline: true,
                },
              );
            await target.send({ embeds: [targetDM] });
          } catch (err: any) {
            logWithLabel("error", err);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await (interaction.channel as TextChannel).send({
              embeds: [embed.setColor("Red").setDescription(client.t("discord:ban.dmFail", { lng: lang }))],
            });
          }

          await interaction.followUp({ embeds: [response] });
          await target.ban({ reason: reason });
        } catch (error: any) {
          logWithLabel("error", error);
          interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setTitle(client.t("discord:ban.execErrorTitle", { lng: lang }))
                .setDescription(client.t("discord:ban.execErrorDesc", { lng: lang })),
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
                .setTitle(client.t("discord:ban.errorTitle", { lng: lang }))
                .setDescription(
                  `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:ban.noChannel", { lng: lang })}`,
                ),
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
            .setDescription(
              `${client.getEmoji(guild.id, "correct")} ${client.t("discord:ban.setupSuccess", { channel: `<#${channel.id}>`, lng: lang })}`,
            )
            .setColor("#00ff00");

          interaction.followUp({
            embeds: [successEmbed],
          });
        } catch (err: any) {
          logWithLabel("error", err);
          interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setTitle(client.t("discord:ban.setupErrorTitle", { lng: lang }))
                .setDescription(client.t("discord:ban.setupErrorDesc", { lng: lang })),
            ],
          });
        }
        break;
      }
    }

    return;
  },
);
