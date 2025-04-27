"use strict";
const discord_js_1 = require("discord.js");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const serverInfo = {
    name: "serverinfo",
    description: "Shows the server information",
    examples: ["server-info"],
    nsfw: false,
    owner: false,
    aliases: ["s-info"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(_client, message) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const guild = message.guild;
        await guild.members.fetch(); // Fetch all members for accurate counts
        await guild.roles.fetch(); // Fetch all roles
        await guild.channels.fetch(); // Fetch all channels
        await guild.emojis.fetch(); // Fetch all emojis
        try {
            // Channel counts
            const channelCounts = {
                text: guild.channels.cache.filter((c) => c.type === discord_js_1.ChannelType.GuildText).size,
                voice: guild.channels.cache.filter((c) => c.type === discord_js_1.ChannelType.GuildVoice).size,
                category: guild.channels.cache.filter((c) => c.type === discord_js_1.ChannelType.GuildCategory).size,
                forum: guild.channels.cache.filter((c) => c.type === discord_js_1.ChannelType.GuildForum).size,
                announcement: guild.channels.cache.filter((c) => c.type === discord_js_1.ChannelType.GuildAnnouncement)
                    .size,
            };
            // Role count (excluding @everyone)
            const roleCount = guild.roles.cache.size - 1;
            // Emoji counts
            const emojiCounts = {
                total: guild.emojis.cache.size,
                static: guild.emojis.cache.filter((e) => !e.animated).size,
                animated: guild.emojis.cache.filter((e) => e.animated).size,
            };
            // Create main embed with all essential info
            const embed = new embeds_extender_1.EmbedCorrect()
                .setColor(guild.roles.highest.color || "#2b2d31")
                .setAuthor({ name: guild.name, iconURL: guild.iconURL() || undefined })
                .setThumbnail(guild.iconURL({ size: 4096 }))
                .addFields({ name: "Owner", value: `<@${guild.ownerId}>`, inline: true }, { name: "Server ID", value: guild.id, inline: true }, {
                name: "Created",
                value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                inline: true,
            }, {
                name: "Members",
                value: `${guild.memberCount} (${guild.members.cache.filter((m) => !m.user.bot).size} users, ${guild.members.cache.filter((m) => m.user.bot).size} bots)`,
                inline: true,
            }, {
                name: "Boosts",
                value: `${guild.premiumSubscriptionCount} (Level ${guild.premiumTier})`,
                inline: true,
            }, { name: "Verification", value: `${guild.verificationLevel}`, inline: true }, {
                name: "Channels",
                value: `Total: ${guild.channels.cache.size}\n` +
                    `Text: ${channelCounts.text}\n` +
                    `Voice: ${channelCounts.voice}\n`,
                inline: true,
            }, {
                name: "Other Counts",
                value: `Roles: ${roleCount}\n` +
                    `Emojis: ${emojiCounts.total}\n` +
                    `(Static: ${emojiCounts.static}, Animated: ${emojiCounts.animated})`,
                inline: true,
            }, {
                name: "Features",
                value: guild.features.join(", ") || "None",
                inline: false,
            })
                .setFooter({ text: `Use '${message.content} --txt' to get full server data as a file` });
            // Create TXT file with all server data if requested
            if (message.content.includes("--txt")) {
                const serverData = generateServerDataTxt(guild);
                const attachment = new discord_js_1.AttachmentBuilder(Buffer.from(serverData), {
                    name: `serverinfo_${guild.id}.txt`,
                });
                return message.reply({ embeds: [embed], files: [attachment] });
            }
            return message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error("Error in serverinfo command:", error);
            message.reply("An error occurred while fetching server information.").catch(() => { });
        }
        return;
    },
};
// Helper function to generate TXT file content
function generateServerDataTxt(guild) {
    let content = `=== SERVER INFORMATION ===\n`;
    content += `Name: ${guild.name}\n`;
    content += `ID: ${guild.id}\n`;
    content += `Owner: ${guild.ownerId}\n`;
    content += `Created: ${guild.createdAt.toUTCString()}\n`;
    content += `Members: ${guild.memberCount} (${guild.members.cache.filter((m) => !m.user.bot).size} users, ${guild.members.cache.filter((m) => m.user.bot).size} bots)\n`;
    content += `Boosts: ${guild.premiumSubscriptionCount} (Level ${guild.premiumTier})\n`;
    content += `Verification Level: ${guild.verificationLevel}\n`;
    content += `Features: ${guild.features.join(", ") || "None"}\n\n`;
    // Channels
    content += `=== CHANNELS ===\n`;
    const channelTypes = [
        discord_js_1.ChannelType.GuildText,
        discord_js_1.ChannelType.GuildVoice,
        discord_js_1.ChannelType.GuildCategory,
        discord_js_1.ChannelType.GuildAnnouncement,
        discord_js_1.ChannelType.GuildStageVoice,
        discord_js_1.ChannelType.GuildForum,
    ];
    channelTypes.forEach((type) => {
        const channels = guild.channels.cache.filter((c) => c.type === type);
        if (channels.size > 0) {
            content += `\n${discord_js_1.ChannelType[type]} Channels (${channels.size}):\n`;
            channels.forEach((channel) => {
                content += `- ${channel.name} (${channel.id})`;
                if (channel.parent)
                    content += ` [Category: ${channel.parent.name}]`;
                content += `\n`;
            });
        }
    });
    // Roles
    content += `\n=== ROLES (${guild.roles.cache.size - 1} excluding @everyone) ===\n`;
    guild.roles.cache
        .sort((a, b) => b.position - a.position)
        .filter((role) => role.id !== guild.id)
        .forEach((role) => {
        content += `\n${role.name} (${role.id})\n`;
        content += `- Color: ${role.hexColor}\n`;
        content += `- Members: ${role.members.size}\n`;
        content += `- Position: ${role.position}\n`;
        content += `- Hoisted: ${role.hoist}\n`;
        content += `- Mentionable: ${role.mentionable}\n`;
        content += `- Permissions: ${role.permissions.toArray().join(", ") || "None"}\n`;
    });
    // Emojis
    content += `\n=== EMOJIS (${guild.emojis.cache.size}) ===\n`;
    guild.emojis.cache.forEach((emoji) => {
        content += `\n${emoji.name} (${emoji.id})\n`;
        content += `- Animated: ${emoji.animated}\n`;
        content += `- URL: ${emoji.url}\n`;
    });
    // Stats
    content += `\n=== STATISTICS ===\n`;
    content += `Max Members: ${guild.maximumMembers || "Unknown"}\n`;
    content += `Max Video Users: ${guild.maxVideoChannelUsers || "Unknown"}\n`;
    content += `Max Bitrate: ${guild.maximumBitrate / 1000}kbps\n`;
    content += `Partnered: ${guild.partnered}\n`;
    content += `Verified: ${guild.verified}\n`;
    content += `Vanity URL: ${guild.vanityURLCode || "None"}\n`;
    content += `Preferred Locale: ${guild.preferredLocale}\n`;
    content += `NSFW Level: ${guild.nsfwLevel}\n`;
    content += `Explicit Content Filter: ${guild.explicitContentFilter}\n`;
    content += `Default Notifications: ${guild.defaultMessageNotifications}\n`;
    return content;
}
module.exports = serverInfo;
