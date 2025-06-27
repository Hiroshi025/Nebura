"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="48aac06a-e340-5189-a7a5-7614c3ca503d")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const addons_1 = require("../../../../../../interfaces/messaging/modules/discord/structure/addons");
const main_1 = require("../../../../../../main");
const embeds_extend_1 = require("../../../../../../shared/adapters/extends/embeds.extend");
exports.default = new addons_1.Addons({
    name: "Extra Events",
    description: "Extra events for the bot, such as message reactions, message edits, etc.",
    author: "Hiroshi025",
    version: "1.0.0",
    bitfield: ["SendMessages"],
}, async (client, c) => {
    client.on("guildCreate", async (guild) => {
        const data = await main_1.main.DB.findDiscord(c.modules.discord?.id);
        if (!data)
            return;
        const logEmbed = new embeds_extend_1.EmbedCorrect()
            .setTitle("New Guild Added")
            .setColor("Green")
            .setDescription([
            `> **Guild Name:** ${guild.name} (\`${guild.id}\`)`,
            `> **Guild Owner:** ${guild.members.me?.user.tag} (\`${guild.members.me?.user.id}\`)`,
            `> **Guild Members:** ${guild.memberCount}`,
        ].join("\n"))
            .setFields({
            name: "Guild Info",
            value: [
                `> **Guild ID:** \`${guild.id}\``,
                `> **Guild Name:** \`${guild.name}\``,
                `> **Guild Owner:** \`${guild.members.me?.user.tag}\``,
                `> **Guild Members:** \`${guild.memberCount}\``,
            ].join("\n"),
        }, {
            name: "Bot Info",
            value: [
                `> **Bot ID:** \`${client.user?.id}\``,
                `> **Bot Name:** \`${client.user?.tag}\``,
                `> **Bot Avatar:** [Click Here](https://cdn.discordapp.com/avatars/${client.user?.id}/${client.user?.avatar})`,
            ].join("\n"),
        });
        const channelId = data.logchannel;
        if (!channelId)
            return;
        const channel = client.channels.cache.get(channelId);
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        await channel.send({ embeds: [logEmbed] });
    });
    client.on("guildDelete", async (guild) => {
        const data = await main_1.main.DB.findDiscord(c.modules.discord?.id);
        if (!data)
            return;
        const logEmbed = new embeds_extend_1.EmbedCorrect()
            .setTitle("Guild Removed")
            .setColor("Red")
            .setDescription([
            `> **Guild Name:** ${guild.name} (\`${guild.id}\`)`,
            `> **Guild Owner:** ${guild.members.me?.user.tag} (\`${guild.members.me?.user.id}\`)`,
            `> **Guild Members:** ${guild.memberCount}`,
        ].join("\n"))
            .setFields({
            name: "Guild Info",
            value: [
                `> **Guild ID:** \`${guild.id}\``,
                `> **Guild Name:** \`${guild.name}\``,
                `> **Guild Owner:** \`${guild.members.me?.user.tag}\``,
                `> **Guild Members:** \`${guild.memberCount}\``,
            ].join("\n"),
        }, {
            name: "Bot Info",
            value: [
                `> **Bot ID:** \`${client.user?.id}\``,
                `> **Bot Name:** \`${client.user?.tag}\``,
                `> **Bot Avatar:** [Click Here](https://cdn.discordapp.com/avatars/${client.user?.id}/${client.user?.avatar})`,
            ].join("\n"),
        });
        const channelId = data.logchannel;
        if (!channelId)
            return;
        const channel = client.channels.cache.get(channelId);
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        await channel.send({ embeds: [logEmbed] });
    });
});
//# sourceMappingURL=events.addon.js.map
//# debugId=48aac06a-e340-5189-a7a5-7614c3ca503d
