"use strict";
const discord_js_1 = require("discord.js");
const eternal_support_1 = require("eternal-support");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const nsfwCommands = {
    name: "nsfw",
    description: "Get a random NSFW image from the specified category.",
    examples: [
        "nsfw hentai",
        "nsfw maid",
        "nsfw panties",
        "nsfw wallpapers",
        "nsfw mobileWallpapers",
        "nsfw gif",
        "nsfw foxgirl",
        "nsfw school",
        "nsfw succubus",
    ],
    nsfw: true,
    owner: false,
    cooldown: 5,
    aliases: ["nsfwimage"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    subcommands: [
        "doujin",
        "hentai",
        "maid",
        "panties",
        "wallpapers",
        "mobileWallpapers",
        "gif",
        "foxgirl",
        "school",
        "succubus",
    ],
    async execute(client, message, args) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const subcommands = args[0];
        const types = [
            "doujin",
            "hentai",
            "maid",
            "panties",
            "wallpapers",
            "mobileWallpapers",
            "gif",
            "foxgirl",
            "school",
            "succubus",
        ];
        if (!subcommands)
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed().setDescription([
                        `${client.getEmoji(message.guild.id, "error")} Please provide a valid subcommand from the following list:`,
                        `> **Subcommands:**\n`,
                        `${(0, discord_js_1.codeBlock)("asciidoc", types.join("\n"))}`,
                    ].join("\n")),
                ],
            });
        if (!types.includes(subcommands))
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed().setDescription([
                        `${client.getEmoji(message.guild.id, "error")} Invalid subcommand \`${subcommands}\`.`,
                        `> **Subcommands:**\n`,
                        `${(0, discord_js_1.codeBlock)("asciidoc", types.join("\n"))}`,
                    ].join("\n")),
                ],
            });
        const subcommand_nsfw = subcommands;
        const image = await eternal_support_1.Nsfw[subcommand_nsfw]();
        if (!image)
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed().setDescription([
                        `${client.getEmoji(message.guild.id, "error")} No image found for the subcommand \`${subcommands}\`.`,
                        "Please try again later.",
                    ].join("\n")),
                ],
            });
        const embed = new embeds_extender_1.EmbedCorrect().setTitle("NSFW Image").setImage(image).setColor("Random");
        return message.channel.send({ embeds: [embed] });
    },
};
module.exports = nsfwCommands;
