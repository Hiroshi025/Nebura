import { ChannelType, inlineCode } from "discord.js";

import { EmbedCorrect } from "@extenders/discord/embeds.extender";
import { Precommand } from "@typings/modules";

const roleInfo: Precommand = {
  name: "roleinfo",
  description: "Shows information about a role",
  examples: ["roleinfo @Moderator", "roleinfo Admins"],
  nsfw: false,
  owner: false,
  aliases: ["r-info"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(_client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    try {
      const roleName = args.join(" ");
      if (!roleName) return message.reply("Please specify a role name or mention.");

      const role =
        message.mentions.roles.first() ||
        message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleName.toLowerCase());

      if (!role) return message.reply("Role not found.");

      await message.guild.members.fetch(); // Fetch members for accurate role member count

      const embed = new EmbedCorrect()
        .setColor(role.color || "#2b2d31")
        .setTitle(`Role Information: ${role.name}`)
        .setThumbnail(role.iconURL({ size: 4096 }))
        .addFields(
          { name: "ID", value: role.id, inline: true },
          { name: "Color", value: role.hexColor, inline: true },
          { name: "Position", value: role.position.toString(), inline: true },
          { name: "Members", value: role.members.size.toString(), inline: true },
          {
            name: "Created",
            value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
          { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
          { name: "Managed", value: role.managed ? "Yes" : "No", inline: true },
          {
            name: "Permissions",
            value:
              role.permissions.toArray().length > 0
                ? inlineCode(role.permissions.toArray().join(", "))
                : "None",
            inline: false,
          },
        );

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in roleinfo command:", error);
      message.reply("An error occurred while fetching role information.").catch(() => {});
    }

    return;
  },
};

export = roleInfo;
