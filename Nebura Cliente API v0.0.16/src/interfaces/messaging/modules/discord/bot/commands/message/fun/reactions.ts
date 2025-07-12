import axios from "axios";
import { AttachmentBuilder, ChannelType, EmbedBuilder, TextChannel } from "discord.js";
import { NekoClient } from "eternal-support";

import emojis from "@config/json/emojis.json";
import { ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";
import { logWithLabel } from "@utils/functions/console";

async function animeApi(action: string) {
  try {
    const res = await axios.get(`https://api.waifu.pics/sfw/${action}`);
    return res.data.url;
  } catch (err) {
    logWithLabel("error", `Error in animeApi: ${err}`);
  }
}

const emotionsCommand: Precommand = {
  name: "reactions",
  nameLocalizations: {
    "es-ES": "reacciones",
    "en-US": "reactions",
  },
  description: "Get a list of emotions",
  descriptionLocalizations: {
    "es-ES": "Obtén una lista de emociones",
    "en-US": "Get a list of emotions",
  },
  examples: [
    "emotions baka",
    "emotions eightball",
    "emotions slap",
    "emotions kiss",
    `anime alert [text]`,
    `anime biden [text]`,
    `anime cringe`,
    `anime facts [text]`,
    `anime handhold [user]`,
    `anime waifu`,
  ],
  subcommands: [
    "emotions baka [user]",
    "emotions eightball [text]",
    "emotions slap [user]",
    "emotions kiss [user]",
    "emotions tickle [user]",
    "anime alert [text]",
    "anime biden [text]",
    "anime cringe",
    "anime facts [text]",
    "anime handhold [user]",
    "anime waifu",
  ],
  nsfw: false,
  category: "Entertainment",
  owner: false,
  cooldown: 2,
  aliases: ["emoticons"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const lang = message.guild?.preferredLocale || "es-ES";
    const nekoclient = new NekoClient();
    const subcommand = args[0];
    switch (subcommand) {
      case "eightball":
        {
          const text = args.join(" ");
          if (!text)
            return message.channel.send({
              embeds: [
                new ErrorEmbed().setDescription(
                  [
                    `${emojis.error} **${message.author.username}**, ${client.t("discord:reactions.needText", { lng: lang })}`,
                    `> **${client.t("discord:reactions.usage8ball", { prefix, lng: lang })}**`,
                  ].join("\n"),
                ),
              ],
            });

          await nekoclient.eightBall({ text: text }).then((result: { response: string | null; url: string }) => {
            const embed = new EmbedBuilder()
              .setTitle(client.t("discord:reactions.eightballTitle", { user: message.author.username, lng: lang }))
              .setColor("Random")
              .setFooter({
                text: client.t("discord:reactions.requestedBy", { user: message.author.username, lng: lang }),
                iconURL: message.author.displayAvatarURL(),
              })
              .setDescription(result.response)
              .setImage(result.url as string);
            (message.channel as TextChannel).send({ embeds: [embed] });
          });
        }
        break;
      case "slap":
        {
          try {
            const user = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder()
              .setTitle(client.t("discord:reactions.emotionsTitle", { lng: lang }))
              .setDescription(client.t("discord:reactions.slapDesc", { author: message.author, user, lng: lang }))
              .setImage((await nekoclient.slap()).url);
            message.channel.send({ embeds: [embed] });
          } catch (error) {
            logWithLabel("error", `Error in slap: ${error}`);
            message.channel.send({
              embeds: [
                new ErrorEmbed().setDescription(
                  [
                    `${emojis.error} **${message.author.username}**, ${client.t("discord:reactions.needText", { lng: lang })}`,
                    `> **${client.t("discord:reactions.usageSlap", { prefix, lng: lang })}**`,
                  ].join("\n"),
                ),
              ],
            });
          }
        }
        break;
      case "kiss":
        {
          try {
            const user = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder()
              .setTitle(client.t("discord:reactions.emotionsTitle", { lng: lang }))
              .setDescription(client.t("discord:reactions.kissDesc", { author: message.author, user, lng: lang }))
              .setImage((await nekoclient.kiss()).url);
            message.channel.send({ embeds: [embed] });
          } catch (error) {
            logWithLabel("error", `Error in kiss: ${error}`);
            message.channel.send({
              content: [
                `${emojis.error} **${message.author.username}**, ${client.t("discord:reactions.needText", { lng: lang })}`,
                `> **${client.t("discord:reactions.usageKiss", { prefix, lng: lang })}**`,
              ].join("\n"),
            });
          }
        }
        break;
      case "tickle":
        {
          try {
            const user = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder()
              .setTitle(client.t("discord:reactions.emotionsTitle", { lng: lang }))
              .setDescription(client.t("discord:reactions.tickleDesc", { author: message.author, user, lng: lang }))
              .setImage((await nekoclient.kiss()).url);
            message.channel.send({ embeds: [embed] });
          } catch (error) {
            logWithLabel("error", `Error in tickle: ${error}`);
            message.channel.send({
              content: [
                `${emojis.error} **${message.author.username}**, ${client.t("discord:reactions.needText", { lng: lang })}`,
                `> **${client.t("discord:reactions.usageTickle", { prefix, lng: lang })}**`,
              ].join("\n"),
            });
          }
        }
        break;
      case "alert":
        {
          const texto = args.slice(1).join(" ");
          if (!texto)
            return message.channel.send(
              [
                `${emojis.error} ${client.t("discord:reactions.needTextImage", { lng: lang })}`,
                client.t("discord:reactions.exampleAlert", { prefix, lng: lang }),
              ].join("\n"),
            );

          const attachment = new AttachmentBuilder(`https://api.popcat.xyz/alert?text=${encodeURIComponent(texto)}`, {
            name: "image.png",
          });

          message.channel.send({ files: [attachment] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} ${client.t("discord:reactions.errorExec", { lng: lang })}`,
                client.t("discord:reactions.reportError", { lng: lang }),
              ].join("\n"),
            });
          });
        }
        break;
      case "biden":
        {
          const texto = args.slice(1).join(" ");
          if (!texto)
            return message.reply(
              [
                `${emojis.error} ${client.t("discord:reactions.needTextImage", { lng: lang })}`,
                client.t("discord:reactions.exampleBiden", { prefix, lng: lang }),
              ].join("\n"),
            );

          const attachment = new AttachmentBuilder(`https://api.popcat.xyz/biden?text=${encodeURIComponent(texto)}`, {
            name: "image.png",
          });

          message.channel.send({ files: [attachment] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} ${client.t("discord:reactions.errorExec", { lng: lang })}`,
                client.t("discord:reactions.reportError", { lng: lang }),
              ].join("\n"),
            });
          });
        }
        break;
      case "cringe":
        {
          const data = await animeApi("cringe");
          const prettyCringe = new EmbedBuilder()
            .setColor("Grey")
            .setAuthor({
              name: client.t("discord:reactions.cringeAuthor", { user: message.author.username, lng: lang }),
              iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
            })
            .setImage(data)
            .setTimestamp();
          message.reply({ embeds: [prettyCringe] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} ${client.t("discord:reactions.errorExec", { lng: lang })}`,
                client.t("discord:reactions.reportError", { lng: lang }),
              ].join("\n"),
            });
          });
        }
        break;
      case "facts":
        {
          const texto = args.slice(1).join(" ");
          if (!texto)
            return message.reply(
              [
                `${emojis.error} ${client.t("discord:reactions.needTextImage", { lng: lang })}`,
                client.t("discord:reactions.exampleFacts", { prefix, lng: lang }),
              ].join("\n"),
            );

          const attachment = new AttachmentBuilder(`https://api.popcat.xyz/facts?text=${encodeURIComponent(texto)}`, {
            name: "image.png",
          });

          message.channel.send({ files: [attachment] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} ${client.t("discord:reactions.errorExec", { lng: lang })}`,
                client.t("discord:reactions.reportError", { lng: lang }),
              ].join("\n"),
            });
          });
        }
        break;
      case "handhold":
        {
          const data = await animeApi("handhold");
          const user = message.mentions.users.first();
          if (!user)
            return message.channel.send(
              [
                `${emojis.error} ${client.t("discord:reactions.mentionUser", { lng: lang })}`,
                client.t("discord:reactions.exampleHandhold", { prefix, lng: lang }),
              ].join("\n"),
            );

          if (user.id === message.author.id)
            return message.channel.send(
              [
                `${emojis.error} ${client.t("discord:reactions.noSelfInteract", { lng: lang })}`,
                client.t("discord:reactions.exampleHandhold", { prefix, lng: lang }),
              ].join("\n"),
            );

          if (user.id === client.user?.id)
            return message.channel.send(
              [
                `${emojis.error} ${client.t("discord:reactions.noBotInteract", { lng: lang })}`,
                client.t("discord:reactions.exampleHandhold", { prefix, lng: lang }),
              ].join("\n"),
            );

          if (user.bot)
            return message.channel.send(
              [
                `${emojis.error} ${client.t("discord:reactions.noBotInteract", { lng: lang })}`,
                client.t("discord:reactions.exampleHandhold", { prefix, lng: lang }),
              ].join("\n"),
            );

          const lonerhld = new EmbedBuilder()
            .setColor("Grey")
            .setAuthor({
              name: client.t("discord:reactions.handholdSelf", {
                user: client.user?.username,
                author: message.author.username,
                lng: lang,
              }),
              iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
            })
            .setImage(data)
            .setTimestamp();

          if (user.id === message.author.id)
            return message.reply({ embeds: [lonerhld] }).catch(() => {
              message.reply({
                content: [
                  ` ${emojis.error} ${client.t("discord:reactions.errorExec", { lng: lang })}`,
                  client.t("discord:reactions.reportError", { lng: lang }),
                ].join("\n"),
              });
            });

          const handholdEmbed = new EmbedBuilder()
            .setColor("Grey")
            .setAuthor({
              name: client.t("discord:reactions.handhold", {
                author: message.author.username,
                user: user.username,
                lng: lang,
              }),
              iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
            })
            .setImage(data)
            .setTimestamp();
          message.reply({ embeds: [handholdEmbed] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} ${client.t("discord:reactions.errorExec", { lng: lang })}`,
                client.t("discord:reactions.reportError", { lng: lang }),
              ].join("\n"),
            });
          });
        }
        break;
      case "waifu":
        {
          const data = await animeApi("waifu");
          const prettyCringe = new EmbedBuilder()
            .setColor("Grey")
            .setAuthor({
              name: client.t("discord:reactions.waifu", { user: message.author.username, lng: lang }),
              iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
            })
            .setImage(data)
            .setTimestamp();
          message.reply({ embeds: [prettyCringe] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} ${client.t("discord:reactions.errorExec", { lng: lang })}`,
                client.t("discord:reactions.reportError", { lng: lang }),
              ].join("\n"),
            });
          });
        }
        break;
    }
  },
};
export default emotionsCommand;
