import { ChannelType, GuildEmoji, TextChannel } from "discord.js";
import moment from "moment";

import { Precommand } from "@/typings/discord";
import { EmbedCorrect } from "@extenders/discord/embeds.extender";

const emojisCommand: Precommand = {
  name: "emoji",
  description: "information emoji in the server discord",
  aliases: ["emojis", "emojiinfo", "emoji-info", "emoji-control"],
  nsfw: false,
  owner: false,
  examples: [`emoji [subcommand] [properties] [emoji]`, `emoji [command] [emoji]`],
  botpermissions: ["ManageEmojisAndStickers", "AttachFiles", "UseExternalEmojis"],
  subcommands: [`emoji add <emoji>`, `emoji info <emoji>`, `emoji jumbo <emoji>`],
  permissions: ["ManageEmojisAndStickers", "AttachFiles", "UseExternalEmojis"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;
    const channel: TextChannel = message.channel as TextChannel;
    const subcommand = args[0];
    switch (subcommand) {
      case "add":
        {
          const emoji = args.slice(1).join(" ");
          const regex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/gi;

          if (!emoji || !emoji.match(regex))
            return message.channel.send({
              content: [
                `${client.getEmoji(message.guild.id, "error")} Unable to add the emoji to the server. Please make sure the emoji is valid.`,
                `**Example:** \`${prefix}addemoji :emoji:\``,
              ].join("\n"),
            });

          const emojiMatch = emoji.match(regex);
          const emojiid = emojiMatch && emojiMatch[0].split(":")[2].replace(">", "");
          const emojiname = (emojiMatch && emojiMatch[0].split(":")[1]) || "invalid";

          const link = `https://cdn.discordapp.com/emojis/${emojiid}.${emoji.startsWith("<a:") ? "gif" : "png"}`;
          if (message.guild?.emojis.cache.find((e) => e.name === emojiname))
            return message.channel.send({
              content: [
                `${client.getEmoji(message.guild.id, "error")} Unable to add the emoji to the server. Please make sure the emoji is valid.`,
                `**Possible Errors:**`,
                `**1.** The emoji is already in the server.`,
                `**2.** The emoji is a default Discord emoji.`,
              ].join("\n"),
            });

          message.guild?.emojis
            .create({ attachment: link, name: emojiname })
            .then((e: GuildEmoji) => {
              if (!message.guild) return;
              channel
                .send({
                  embeds: [
                    new EmbedCorrect()
                      .setDescription(
                        [
                          `${client.getEmoji(message.guild.id, "correct")} The emoji with **id:** \`${emojiid}\` and **name:** \`${emojiname}\` has been added to the server.`,
                          `**Link:** [Click Here](${e.imageURL({
                            extension: "png",
                          })}})`,
                        ].join("\n"),
                      )
                      .setThumbnail(e.imageURL({ extension: "png" })),
                  ],
                })
                .catch(() => {
                  if (!message.guild) return;
                  channel.send({
                    content: [
                      `${client.getEmoji(message.guild.id, "error")} Unable to add the emoji to the server. Please make sure the emoji is valid.`,
                      `**Example:** \`${prefix}addemoji :emoji:\``,
                    ].join("\n"),
                  });
                });
            });
        }
        break;
      case "info":
        {
          const emoji = args[1].trim();
          const regex = /<a?:\w+:\d+>/g;
          if (!emoji || !regex.test(emoji))
            return message.channel.send({
              content: [
                `${client.getEmoji(message.guild.id, "error")} Unable to find information for the emoji. Please make sure the emoji is valid.`,
                `**Example:** \`${prefix}emoji info :emoji:\``,
              ].join("\n"),
            });

          const emojiMatch = emoji.match(regex);
          const emojiid = emojiMatch && emojiMatch[0].split(":")[2].replace(">", "");
          const emojiname = (emojiMatch && emojiMatch[0].split(":")[1]) || "invalid";

          const emojiurl = `https://cdn.discordapp.com/emojis/${emojiid}.png`;

          const embed = new EmbedCorrect()
            .addFields(
              {
                name: "Emoji Type",
                value: emoji.startsWith("<a:") ? "> Animated" : "> Static",
                inline: true,
              },
              {
                name: "Emoji for Guild",
                value: message.guild?.emojis.cache.has(emojiid as string)
                  ? `> ${client.getEmoji(message.guild.id, "correct")}Yes`
                  : `> ${client.getEmoji(message.guild.id, "error")} No`,
                inline: true,
              },
              {
                name: "Emoji Created at",
                value:
                  "> " +
                  "__**" +
                  moment(Number(emojiid) / 4194304 + 1420070400000).format(
                    "dddd, MMMM Do YYYY, h:mm:ss a",
                  ) +
                  "**__",
              },
              { name: "Name", value: `> \`${emojiname ?? ""}\``, inline: true },
              { name: "ID", value: `> \`${emojiid ?? ""}\``, inline: true },
              {
                name: "Animated",
                value: emoji?.startsWith("<a:")
                  ? `> ${client.getEmoji(message.guild.id, "correct")} Yes`
                  : `> ${client.getEmoji(message.guild.id, "error")} No`,
                inline: true,
              },
              {
                name: "Emoji Image Link",
                value: `> [Click Here for Image](${emojiurl ?? ""})`,
              },
              { name: "Identifier", value: `> \`${emoji ?? ""}\`` },
              {
                name: "Is Managed",
                value: message.guild?.emojis.cache.has(emojiid as string)
                  ? (message.guild?.emojis.cache.get(emojiid as string)?.managed ?? false)
                    ? `> ${client.getEmoji(message.guild.id, "correct")} Yes`
                    : `> ${client.getEmoji(message.guild.id, "error")} No`
                  : `> ${client.getEmoji(message.guild.id, "error")}No`,
                inline: true,
              },
              {
                name: "Has Required Colon",
                value: emoji.startsWith("<a:")
                  ? `> ${client.getEmoji(message.guild.id, "correct")} Yes`
                  : `> ${client.getEmoji(message.guild.id, "error")} No`,
                inline: true,
              },
            )
            .setImage(`${emojiurl}`);

          message.channel.send({ embeds: [embed] });
        }
        break;
      case "jumbo":
        {
          const emoji = args[1].trim();
          const regex = /<a?:\w+:\d+>/g;
          if (!emoji || !regex.test(emoji))
            return message.channel.send({
              content: [
                `${client.getEmoji(message.guild.id, "error")} Unable to find information for the emoji. Please make sure the emoji is valid.`,
                `**Example:** \`${prefix}emoji jumbo :emoji:\``,
              ].join("\n"),
            });

          const emojiMatch = emoji.match(regex);
          const emojiid = emojiMatch && emojiMatch[0].split(":")[2].replace(">", "");
          const emojiname = (emojiMatch && emojiMatch[0].split(":")[1]) || "invalid";

          const emojiurl = `https://cdn.discordapp.com/emojis/${emojiid}.png`;

          const embed = new EmbedCorrect().setTitle(`Emoji: ${emojiname}`).setImage(`${emojiurl}`);

          message.channel.send({ embeds: [embed] });
        }
        break;
    }

    return;
  },
};
export = emojisCommand;
