"use strict";
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../main");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const console_1 = require("../../../../../../shared/utils/functions/console");
const adminBanCommand = {
    name: "adminban",
    description: "Ban a member via text commands!",
    examples: ["adminban @user reason"],
    nsfw: false,
    owner: false,
    aliases: ["ban"],
    botpermissions: ["BanMembers"],
    permissions: ["BanMembers"],
    async execute(client, message, args) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const embed = new discord_js_1.EmbedBuilder();
        // Validación de permisos del usuario ejecutor
        if (!message.member?.permissions.has(discord_js_1.PermissionFlagsBits.BanMembers)) {
            return message.channel.send({
                embeds: [
                    embed.setColor("Red").setDescription("You do not have permission to ban members."),
                ],
            });
        }
        const target = message.mentions.members?.first();
        const reason = args.slice(1).join(" ") || "No reason provided.";
        if (!target) {
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Admin Ban Command Error")
                        .setDescription("Please mention a valid user to ban."),
                ],
            });
        }
        if (target.user.id === client.user?.id) {
            return message.channel.send({
                embeds: [embed.setColor("Red").setDescription("You cannot ban me!")],
            });
        }
        if (target.user.id === message.author.id) {
            return message.channel.send({
                embeds: [embed.setColor("Yellow").setDescription("You cannot ban yourself.")],
            });
        }
        if (target.roles.highest.position >=
            message.member.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor("Red")
                        .setDescription("The member has a higher role than you, so you cannot ban them."),
                ],
            });
        }
        if (!message.guild.members.me?.permissions.has("BanMembers")) {
            return message.channel.send({
                embeds: [embed.setColor("Red").setDescription("I do not have permission to ban members.")],
            });
        }
        const banSys = await main_1.main.prisma.banUser.findFirst({
            where: { guildId: message.guild.id },
        });
        if (!banSys) {
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Admin Ban Command Error")
                        .setDescription("Missing configuration. Please set up the ban logs channel using `/ban setup`."),
                ],
            });
        }
        try {
            await main_1.main.prisma.banUser.create({
                data: {
                    guildId: message.guild.id,
                    userId: target.id,
                    banReason: reason,
                    banTime: new Date(),
                },
            });
            const modlog = await main_1.main.prisma.serverModlog.findFirst({
                where: { guildId: message.guild.id },
            });
            if (modlog?.channelId) {
                const channelDB = message.guild.channels.cache.get(modlog.channelId);
                if (channelDB?.isTextBased()) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    channelDB.send({
                        embeds: [
                            new discord_js_1.EmbedBuilder()
                                .setColor("Red")
                                .setTitle(`User banned by ${(0, discord_js_1.userMention)(message.author.id)}`)
                                .addFields({ name: "Banned User", value: `<@${target.id}>` }, { name: "User ID", value: `${target.id}` }, { name: "Ban Date", value: `${new Date().toISOString()}` }, { name: "Reason", value: `\`\`\`${reason}\`\`\`` }),
                        ],
                    });
                }
            }
            const response = new discord_js_1.EmbedBuilder()
                .setTitle("User successfully banned!")
                .setColor("Green")
                .setThumbnail(target.user.avatarURL({ forceStatic: true }))
                .addFields({ name: "ID", value: target.user.id }, { name: "Reason", value: reason }, {
                name: "Joined Server",
                value: target.joinedTimestamp
                    ? `<t:${parseInt((target.joinedTimestamp / 1000).toString())}:R>`
                    : "Unknown",
                inline: true,
            }, {
                name: "Account Created",
                value: `<t:${parseInt((target.user.createdTimestamp / 1000).toString())}:R>`,
                inline: true,
            });
            try {
                const targetDM = new discord_js_1.EmbedBuilder()
                    .setTitle(`You have been banned from the server: ${message.guild.name}!`)
                    .setColor("Red")
                    .setThumbnail(target.user.avatarURL({ forceStatic: true }))
                    .addFields({ name: "ID", value: target.user.id }, { name: "Reason", value: reason }, {
                    name: "Joined Server",
                    value: target.joinedTimestamp
                        ? `<t:${parseInt((target.joinedTimestamp / 1000).toString())}:R>`
                        : "Unknown",
                    inline: true,
                });
                await target.send({ embeds: [targetDM] });
            }
            catch (err) {
                (0, console_1.logWithLabel)("error", err);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await message.channel.send({
                    embeds: [
                        embed
                            .setColor("Red")
                            .setDescription("Failed to send a direct message to the banned user. They might have DMs disabled."),
                    ],
                });
            }
            await message.channel.send({ embeds: [response] });
            await target.ban({ reason: reason });
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", error);
            message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Command Execution Error")
                        .setDescription("An unexpected error occurred. Please try again."),
                ],
            });
        }
        return;
    },
};
module.exports = adminBanCommand;
