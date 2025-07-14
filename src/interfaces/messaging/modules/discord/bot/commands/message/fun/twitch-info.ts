import axios from "axios";
import { ChannelType } from "discord.js";

import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const twitchInfo: Precommand = {
  name: "twitch-info",
  nameLocalizations: {
    "es-ES": "twitch-info",
    "en-US": "twitch-info",
  },
  description: "Provides information on Twitch profile accounts",
  descriptionLocalizations: {
    "es-ES": "Proporciona información sobre cuentas de perfil de Twitch",
    "en-US": "Provides information on Twitch profile accounts",
  },
  examples: ["twitch-info <username>"],
  nsfw: false,
  category: "Entertainment",
  owner: false,
  aliases: ["twitch", "twitchinfo", "twitchprofile"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const lang = message.guild?.preferredLocale || "es-ES";

    const user = args[0];
    if (!user) {
      return message.channel.send({
        embeds: [
          new ErrorEmbed()
            .setTitle(client.t("discord:twitchinfo.errorTitle", { lng: lang }))
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:twitchinfo.noUsername", { lng: lang })}`,
                client.t("discord:twitchinfo.usage", { lng: lang }),
              ].join("\n"),
            ),
        ],
      });
    }

    try {
      const Response = await axios.get(`https://api.crunchprank.net/twitch/followcount/${user.toLowerCase()}`);
      const upTime = await axios.get(`https://api.crunchprank.net/twitch/uptime/${user.toLowerCase()}`);
      const totalViews = await axios.get(`https://api.crunchprank.net/twitch/total_views/${user.toLowerCase()}`);
      const accountage = await axios.get(`https://api.crunchprank.net/twitch/creation/${user.toLowerCase()}`);
      const lastGame = await axios.get(`https://api.crunchprank.net/twitch/game/${user.toLowerCase()}`);
      const avatarimg = await axios.get(`https://api.crunchprank.net/twitch/avatar/${user.toLowerCase()}`);

      let uptimeText = upTime.data;
      if (uptimeText === `${user} is offline`) {
        uptimeText = client.t("discord:twitchinfo.offline", { lng: lang });
      }

      const embed = new EmbedCorrect()
        .setColor("#e100ff")
        .setTitle(client.t("discord:twitchinfo.title", { user, lng: lang }))
        .setDescription(
          [
            `❣️ **${client.t("discord:twitchinfo.followers", { lng: lang })}**: ${Response.data}`,
            `👀 **${client.t("discord:twitchinfo.views", { lng: lang })}**: ${totalViews.data}`,
            `⬆ **${client.t("discord:twitchinfo.uptime", { lng: lang })}**: ${uptimeText}`,
            `📝 **${client.t("discord:twitchinfo.created", { lng: lang })}**: ${accountage.data}`,
            `⏮️ **${client.t("discord:twitchinfo.lastGame", { lng: lang })}**: ${lastGame.data}`,
            `🔴 **${client.t("discord:twitchinfo.live", { lng: lang })}**: ${uptimeText}`,
          ].join("\n"),
        )
        .setFooter({
          text: client.t("discord:twitchinfo.footer", { user: message.author.tag, lng: lang }),
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
            .setTitle(client.t("discord:twitchinfo.errorTitle", { lng: lang }))
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:twitchinfo.error", { lng: lang })}`,
                client.t("discord:twitchinfo.tryAgain", { lng: lang }),
              ].join("\n"),
            ),
        ],
      });
    }
  },
};

export default twitchInfo;
