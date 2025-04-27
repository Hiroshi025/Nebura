"use strict";
const discord_js_1 = require("discord.js");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const leaveCommand = {
    name: "leave",
    description: "Leave guild bot the manager",
    nsfw: false,
    owner: true,
    cooldown: 5,
    aliases: ["leave-guild"],
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(client, message, args, prefix) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const serverId = args[0];
        if (!serverId)
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Error Command Handler")
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "error")} The command is missing arguments to execute!`,
                        `> **Usage:** \`${prefix}leave <serverId>\``,
                    ].join("\n")),
                ],
            });
        const server = client.guilds.cache.get(serverId);
        server?.leave();
        message.channel.send({
            embeds: [
                new embeds_extender_1.EmbedCorrect()
                    .setTitle("Leave Guild")
                    .setDescription([
                    `${client.getEmoji(message.guild.id, "correct")}
              } The bot has left the guild with the ID: \`${serverId}\``,
                    `> **Note:** If you want to invite the bot again`,
                ].join("\n"))
                    .setFields({
                    name: "__Information Guild__",
                    value: [
                        `> **Name:** ${server?.name}`,
                        `> **ID:** ${serverId}`,
                        `> **Owner:** ${server?.ownerId}`,
                        `> **Members:** ${server?.memberCount}`,
                        `> **Channels:** ${server?.channels.cache.size}`,
                    ].join("\n"),
                }),
            ],
        });
        return;
    },
};
module.exports = leaveCommand;
