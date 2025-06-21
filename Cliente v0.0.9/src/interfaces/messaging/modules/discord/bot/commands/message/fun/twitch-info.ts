import axios from "axios";
import { ChannelType } from "discord.js";

import { EmbedCorrect, ErrorEmbed } from "@extenders/embeds.extend";
import { Precommand } from "@typings/modules/discord";

const twitchInfo: Precommand = {
  name: "twitch-info",
  description: "Provides information on Twitch profile accounts",
  examples: ["twitch-info <username>"],
  nsfw: false,
  owner: false,
  aliases: ["twitch", "twitchinfo", "twitchprofile"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    const user = args[0];
    if (!user) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Command Twitch")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} The **username** argument is required.`,
                `Please provide a valid Twitch username.`,
              ].join("\n"),
            ),
        ],
      });
    }

    try {
      const Response = await axios.get(
        `https://api.crunchprank.net/twitch/followcount/${user.toLowerCase()}`,
      );
      const upTime = await axios.get(
        `https://api.crunchprank.net/twitch/uptime/${user.toLowerCase()}`,
      );
      const totalViews = await axios.get(
        `https://api.crunchprank.net/twitch/total_views/${user.toLowerCase()}`,
      );
      const accountage = await axios.get(
        `https://api.crunchprank.net/twitch/creation/${user.toLowerCase()}`,
      );
      const lastGame = await axios.get(
        `https://api.crunchprank.net/twitch/game/${user.toLowerCase()}`,
      );
      const avatarimg = await axios.get(
        `https://api.crunchprank.net/twitch/avatar/${user.toLowerCase()}`,
      );

      if (upTime.data === `${user} is offline`) {
        upTime.data = "esta Offline";
      }

      const embed = new EmbedCorrect()
        .setColor("#e100ff")
        .setTitle(`Twitch stats de: ${user}`)
        .setDescription(
          `❣️ **Followers**: ${Response.data} \n
            👀 **Views**: ${totalViews.data}\n 
            ⬆ **Uptime**: ${upTime.data} \n
            📝 **Creado el**: ${accountage.data}  \n
            ⏮️ **Ultimo juego**: ${lastGame.data} \n
            🔴 **En directo**: ${upTime.data}`,
        )
        .setFooter({
          text: `Informacion requerida por: ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setURL(`https://twitch.tv/${user}`)
        .setThumbnail("https://pngimg.com/uploads/twitch/twitch_PNG27.png")
        .setImage(`${avatarimg.data}`)
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    } catch (err) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Command Twitch")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} An error occurred while fetching Twitch information.`,
                `Please try again later.`,
              ].join("\n"),
            ),
        ],
      });
    }
  },
};

export = twitchInfo;
