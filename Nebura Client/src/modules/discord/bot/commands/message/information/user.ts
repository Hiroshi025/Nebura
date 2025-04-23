import { ChannelType, inlineCode } from "discord.js";

import { EmbedCorrect } from "@extenders/discord/embeds.extender";
import { Precommand } from "@typings/modules/discord";

const userInfo: Precommand = {
  name: "userinfo",
  description: "Shows information about a user",
  examples: ["userinfo @User", "userinfo username"],
  nsfw: false,
  owner: false,
  aliases: ["u-info"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(_client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    try {
      const userArg = args.join(" ");
      const targetUser =
        message.mentions.users.first() ||
        message.guild.members.cache.find(
          (m) =>
            m.user.username.toLowerCase() === userArg.toLowerCase() ||
            m.displayName.toLowerCase() === userArg.toLowerCase(),
        )?.user ||
        (userArg ? undefined : message.author);

      if (!targetUser) return message.reply("User not found.");

      const member = message.guild.members.cache.get(targetUser.id);
      await message.guild.members.fetch(targetUser.id); // Refresh member data

      const embed = new EmbedCorrect()
        .setColor(member?.roles.highest.color || "#2b2d31")
        .setAuthor({
          name: member?.displayName || targetUser.username,
          iconURL: targetUser.displayAvatarURL(),
        })
        .setThumbnail(targetUser.displayAvatarURL({ size: 4096 }))
        .addFields(
          { name: "Username", value: inlineCode(targetUser.tag), inline: true },
          { name: "ID", value: targetUser.id, inline: true },
          { name: "Bot", value: targetUser.bot ? "Yes" : "No", inline: true },
          {
            name: "Joined Server",
            value: member?.joinedAt
              ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
              : "Unknown",
            inline: true,
          },
          {
            name: "Account Created",
            value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: "Roles",
            value: member?.roles.cache.size
              ? `${member.roles.cache.size - 1} (Highest: ${member.roles.highest})`
              : "None",
            inline: true,
          },
          {
            name: "Status",
            value: member?.presence?.status || "Offline",
            inline: true,
          },
          {
            name: "Boost Status",
            value: member?.premiumSince
              ? `Since <t:${Math.floor(member.premiumSince.getTime() / 1000)}:R>`
              : "Not boosting",
            inline: true,
          },
        );

      if (member?.permissions) {
        embed.addFields({
          name: "Key Permissions",
          value:
            member.permissions
              .toArray()
              .filter((p) =>
                [
                  "Administrator",
                  "KickMembers",
                  "BanMembers",
                  "ManageChannels",
                  "ManageGuild",
                  "ManageMessages",
                ].includes(p),
              )
              .join(", ") || "None",
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in userinfo command:", error);
      message.reply("An error occurred while fetching user information.").catch(() => {});
    }

    return;
  },
};

export = userInfo;
