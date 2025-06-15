import { ChannelType } from "discord.js";

import { Addons } from "@/interfaces/messaging/modules/discord/structure/addons";
import { main } from "@/main";
import { EmbedCorrect } from "@modules/discord/structure/extends/embeds.extend";

export default new Addons(
  {
    name: "Extra Events",
    description: "Extra events for the bot, such as message reactions, message edits, etc.",
    author: "Hiroshi025",
    version: "1.0.0",
    bitfield: ["SendMessages"],
  },
  async (client, c) => {
    client.on("guildCreate", async (guild) => {
      const data = await main.DB.findDiscord(c.modules.discord?.clientId);
      if (!data) return;

      const logEmbed = new EmbedCorrect()
        .setTitle("New Guild Added")
        .setColor("Green")
        .setDescription(
          [
            `> **Guild Name:** ${guild.name} (\`${guild.id}\`)`,
            `> **Guild Owner:** ${guild.members.me?.user.tag} (\`${guild.members.me?.user.id}\`)`,
            `> **Guild Members:** ${guild.memberCount}`,
          ].join("\n"),
        )
        .setFields(
          {
            name: "Guild Info",
            value: [
              `> **Guild ID:** \`${guild.id}\``,
              `> **Guild Name:** \`${guild.name}\``,
              `> **Guild Owner:** \`${guild.members.me?.user.tag}\``,
              `> **Guild Members:** \`${guild.memberCount}\``,
            ].join("\n"),
          },
          {
            name: "Bot Info",
            value: [
              `> **Bot ID:** \`${client.user?.id}\``,
              `> **Bot Name:** \`${client.user?.tag}\``,
              `> **Bot Avatar:** [Click Here](https://cdn.discordapp.com/avatars/${client.user?.id}/${client.user?.avatar})`,
            ].join("\n"),
          },
        );

      const channelId = data.logchannel;
      if (!channelId) return;

      const channel = client.channels.cache.get(channelId);
      if (!channel || channel.type !== ChannelType.GuildText) return;
      await channel.send({ embeds: [logEmbed] });
    });

    client.on("guildDelete", async (guild) => {
      const data = await main.DB.findDiscord(c.modules.discord?.clientId);
      if (!data) return;

      const logEmbed = new EmbedCorrect()
        .setTitle("Guild Removed")
        .setColor("Red")
        .setDescription(
          [
            `> **Guild Name:** ${guild.name} (\`${guild.id}\`)`,
            `> **Guild Owner:** ${guild.members.me?.user.tag} (\`${guild.members.me?.user.id}\`)`,
            `> **Guild Members:** ${guild.memberCount}`,
          ].join("\n"),
        )
        .setFields(
          {
            name: "Guild Info",
            value: [
              `> **Guild ID:** \`${guild.id}\``,
              `> **Guild Name:** \`${guild.name}\``,
              `> **Guild Owner:** \`${guild.members.me?.user.tag}\``,
              `> **Guild Members:** \`${guild.memberCount}\``,
            ].join("\n"),
          },
          {
            name: "Bot Info",
            value: [
              `> **Bot ID:** \`${client.user?.id}\``,
              `> **Bot Name:** \`${client.user?.tag}\``,
              `> **Bot Avatar:** [Click Here](https://cdn.discordapp.com/avatars/${client.user?.id}/${client.user?.avatar})`,
            ].join("\n"),
          },
        );

      const channelId = data.logchannel;
      if (!channelId) return;

      const channel = client.channels.cache.get(channelId);
      if (!channel || channel.type !== ChannelType.GuildText) return;
      await channel.send({ embeds: [logEmbed] });
    });
  },
);
