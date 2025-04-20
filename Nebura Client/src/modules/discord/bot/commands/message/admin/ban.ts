import {
	ChannelType, EmbedBuilder, GuildMemberRoleManager, PermissionFlagsBits, TextChannel, userMention
} from "discord.js";

import { main } from "@/main";
import { Precommand } from "@/typings/discord";
import { ErrorEmbed } from "@extenders/discord/embeds.extender";
import { logWithLabel } from "@utils/functions/console";

const adminBanCommand: Precommand = {
  name: "adminban",
  description: "Ban a member via text commands!",
  examples: ["adminban @user reason"],
  nsfw: false,
  owner: false,
  aliases: ["ban"],
  botpermissions: ["BanMembers"],
  permissions: ["BanMembers"],
  async execute(client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    const embed = new EmbedBuilder();

    // Validación de permisos del usuario ejecutor
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.channel.send({
        embeds: [embed.setColor("Red").setDescription("You do not have permission to ban members.")],
      });
    }

    const target = message.mentions.members?.first();
    const reason = args.slice(1).join(" ") || "No reason provided.";

    if (!target) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Admin Ban Command Error")
            .setDescription("Please mention a valid user to ban."),
        ],
      });
    }

    if (target.user.id === client.user?.id) {
      return message.channel.send({
        embeds: [embed.setColor("Red").setDescription("You cannot ban me!")],
      });
    }

    if (target.user.id === message.author.id) {
      return message.channel.send({
        embeds: [embed.setColor("Yellow").setDescription("You cannot ban yourself.")],
      });
    }

    if (
      target.roles.highest.position >=
      (message.member.roles as GuildMemberRoleManager).highest.position
    ) {
      return message.channel.send({
        embeds: [
          embed
            .setColor("Red")
            .setDescription("The member has a higher role than you, so you cannot ban them."),
        ],
      });
    }

    if (!message.guild.members.me?.permissions.has("BanMembers")) {
      return message.channel.send({
        embeds: [embed.setColor("Red").setDescription("I do not have permission to ban members.")],
      });
    }

    const banSys = await main.prisma.banUser.findFirst({
      where: { guildId: message.guild.id },
    });
    if (!banSys) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Admin Ban Command Error")
            .setDescription(
              "Missing configuration. Please set up the ban logs channel using `/ban setup`.",
            ),
        ],
      });
    }

    try {
      await main.prisma.banUser.create({
        data: {
          guildId: message.guild.id,
          userId: target.id,
          banReason: reason,
          banTime: new Date(),
        },
      });

      const modlog = await main.prisma.serverModlog.findFirst({
        where: { guildId: message.guild.id },
      });
      if (modlog?.channelId) {
        const channelDB = message.guild.channels.cache.get(modlog.channelId);
        if (channelDB?.isTextBased()) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          (channelDB as TextChannel).send({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setTitle(`User banned by ${userMention(message.author.id)}`)
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
          .setTitle(`You have been banned from the server: ${message.guild.name}!`)
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
        await message.channel.send({
          embeds: [
            embed
              .setColor("Red")
              .setDescription(
                "Failed to send a direct message to the banned user. They might have DMs disabled.",
              ),
          ],
        });
      }

      await message.channel.send({ embeds: [response] });
      await target.ban({ reason: reason });
    } catch (error: any) {
      logWithLabel("error", error);
      message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Command Execution Error")
            .setDescription("An unexpected error occurred. Please try again."),
        ],
      });
    }

    return;
  },
};

export = adminBanCommand;