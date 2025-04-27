"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const moment_1 = __importDefault(require("moment"));
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const emojisCommand = {
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
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const channel = message.channel;
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
                        .then((e) => {
                        if (!message.guild)
                            return;
                        channel
                            .send({
                            embeds: [
                                new embeds_extender_1.EmbedCorrect()
                                    .setDescription([
                                    `${client.getEmoji(message.guild.id, "correct")} The emoji with **id:** \`${emojiid}\` and **name:** \`${emojiname}\` has been added to the server.`,
                                    `**Link:** [Click Here](${e.imageURL({
                                        extension: "png",
                                    })}})`,
                                ].join("\n"))
                                    .setThumbnail(e.imageURL({ extension: "png" })),
                            ],
                        })
                            .catch(() => {
                            if (!message.guild)
                                return;
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
                    const embed = new embeds_extender_1.EmbedCorrect()
                        .addFields({
                        name: "Emoji Type",
                        value: emoji.startsWith("<a:") ? "> Animated" : "> Static",
                        inline: true,
                    }, {
                        name: "Emoji for Guild",
                        value: message.guild?.emojis.cache.has(emojiid)
                            ? `> ${client.getEmoji(message.guild.id, "correct")}Yes`
                            : `> ${client.getEmoji(message.guild.id, "error")} No`,
                        inline: true,
                    }, {
                        name: "Emoji Created at",
                        value: "> " +
                            "__**" +
                            (0, moment_1.default)(Number(emojiid) / 4194304 + 1420070400000).format("dddd, MMMM Do YYYY, h:mm:ss a") +
                            "**__",
                    }, { name: "Name", value: `> \`${emojiname ?? ""}\``, inline: true }, { name: "ID", value: `> \`${emojiid ?? ""}\``, inline: true }, {
                        name: "Animated",
                        value: emoji?.startsWith("<a:")
                            ? `> ${client.getEmoji(message.guild.id, "correct")} Yes`
                            : `> ${client.getEmoji(message.guild.id, "error")} No`,
                        inline: true,
                    }, {
                        name: "Emoji Image Link",
                        value: `> [Click Here for Image](${emojiurl ?? ""})`,
                    }, { name: "Identifier", value: `> \`${emoji ?? ""}\`` }, {
                        name: "Is Managed",
                        value: message.guild?.emojis.cache.has(emojiid)
                            ? (message.guild?.emojis.cache.get(emojiid)?.managed ?? false)
                                ? `> ${client.getEmoji(message.guild.id, "correct")} Yes`
                                : `> ${client.getEmoji(message.guild.id, "error")} No`
                            : `> ${client.getEmoji(message.guild.id, "error")}No`,
                        inline: true,
                    }, {
                        name: "Has Required Colon",
                        value: emoji.startsWith("<a:")
                            ? `> ${client.getEmoji(message.guild.id, "correct")} Yes`
                            : `> ${client.getEmoji(message.guild.id, "error")} No`,
                        inline: true,
                    })
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
                    const embed = new embeds_extender_1.EmbedCorrect().setTitle(`Emoji: ${emojiname}`).setImage(`${emojiurl}`);
                    message.channel.send({ embeds: [embed] });
                }
                break;
        }
        return;
    },
};
module.exports = emojisCommand;
