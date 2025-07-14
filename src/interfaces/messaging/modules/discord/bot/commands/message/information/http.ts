/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmbedBuilder } from "discord.js";
import { STATUS_CODES } from "http";

import emojis from "@config/json/emojis.json";
import { ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const httpCommand: Precommand = {
  name: "https",
  nameLocalizations: {
    "es-ES": "https",
    "en-US": "https",
  },
  description: "Show httpstatus with a meme image and description",
  descriptionLocalizations: {
    "es-ES": "Muestra el estado HTTP con una imagen de meme y descripción",
    "en-US": "Show httpstatus with a meme image and description",
  },
  examples: ["httpsstatus [status]", "httpsstatus [params] 200"],
  nsfw: false,
  owner: false,
  cooldown: 5,
  category: "Information",
  aliases: ["httpstatuscode", "httpstatuscodes", "httpstatuscodes", "httpstatuscode"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    try {
      if (!message.guild) return;
      const lang = message.guild.preferredLocale || "en-US";
      const status = args[0];
      if (!status)
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setFooter({
                text: client.t("discord:http.requestedBy", { user: message.author.tag, lng: lang }),
                iconURL: client.user?.displayAvatarURL(),
              })
              .setDescription(
                [
                  `${emojis.error} ${client.t("discord:http.noStatus", { lng: lang })}`,
                  client.t("discord:http.usage", { prefix, lng: lang }),
                ].join("\n"),
              ),
          ],
        });

      if (status !== "599" && !STATUS_CODES[status])
        return message.reply({
          content: [
            `${emojis.error} ${client.t("discord:http.invalidStatus", { lng: lang })}`,
            client.t("discord:http.usage", { prefix, lng: lang }),
          ].join("\n"),
        });

      return message.reply({
        content: `https://http.cat/${status}.jpg`,
      });
    } catch (e: any) {
      const lang = message.guild?.preferredLocale || "en-US";
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setFooter({
              text: client.t("discord:http.requestedBy", { user: message.author.tag, lng: lang }),
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(
              [
                `${emojis.error} ${client.t("discord:http.errorExec", { lng: lang })}`,
                client.t("discord:http.tryAgain", { lng: lang }),
              ].join("\n"),
            )
            .setErrorFormat(e.stack),
        ],
      });
    }
  },
};

export default httpCommand;
