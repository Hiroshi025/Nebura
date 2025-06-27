"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="3e47e207-7e55-5674-a13c-529e0953ecfc")}catch(e){}}();

const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const roomsCommand = {
    name: "rooms",
    description: "Create a voice channel rooms config system",
    examples: ["rooms enabled"],
    nsfw: false,
    owner: false,
    cooldown: 10,
    aliases: ["room"],
    botpermissions: ["ManageChannels"],
    permissions: ["Administrator"],
    subcommands: ["rooms enabled <channel_id>", "rooms disabled"],
    async execute(client, message, args, prefix) {
        if (!message.guild || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const subcommands = args[0];
        switch (subcommands) {
            case "enabled":
                {
                    const data = await main_1.main.prisma.myGuild.findUnique({
                        where: { guildId: message.guild.id },
                    });
                    if (!data)
                        return message.channel.send({
                            embeds: [
                                new embeds_extend_1.ErrorEmbed()
                                    .setTitle("Error Rooms - Systems")
                                    .setDescription([
                                    `${client.getEmoji(message.guild.id, "error")} An error occurred while trying to enable the rooms system.`,
                                    `Please try again later or contact the support team.`,
                                ].join("\n")),
                            ],
                        });
                    const embed = new embeds_extend_1.EmbedCorrect()
                        .setTitle("Rooms System - Enabled")
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "correct")} You are in the voice room system configuration menu now.`,
                        `Please select the channel where you want to create the rooms.`,
                        `**Current Channel:** ${data.rooms ? `<#${data.rooms}>` : "Not set"}`,
                        `> **Note:** A hidden category called rooms will be created for text channels, hidden from members.`,
                    ].join("\n"));
                    const msg = await message.channel.send({
                        embeds: [embed],
                        components: [
                            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ChannelSelectMenuBuilder()
                                .setCustomId("rooms-menu-config")
                                .setPlaceholder("Select a voice channel")
                                .setChannelTypes(discord_js_1.ChannelType.GuildVoice)
                                .setMaxValues(1)),
                            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                                .setLabel("Confirm Selection")
                                .setStyle(discord_js_1.ButtonStyle.Success)
                                .setEmoji(client.getEmoji(message.guild.id, "circle_check"))
                                .setCustomId("rooms-confirm-selection"), new discord_js_1.ButtonBuilder()
                                .setLabel("Cancel")
                                .setStyle(discord_js_1.ButtonStyle.Danger)
                                .setEmoji(client.getEmoji(message.guild.id, "circle_x"))
                                .setCustomId("rooms-cancel-selection")),
                        ],
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter: (i) => i.user.id === message.author.id,
                        time: 60000,
                    });
                    collector.on("collect", async (interaction) => {
                        if (!message.guild || !message.channel || !client.user)
                            return;
                        if (interaction.isChannelSelectMenu()) {
                            const selectedChannel = interaction.values[0];
                            const channel = message.guild.channels.cache.get(selectedChannel);
                            if (!channel || channel.type !== discord_js_1.ChannelType.GuildVoice) {
                                return interaction.reply({
                                    embeds: [
                                        new embeds_extend_1.ErrorEmbed().setDescription([
                                            `${client.getEmoji(message.guild.id, "error")} Please select a valid voice channel.`,
                                            `The selected channel must be a voice channel.`,
                                        ].join("\n")),
                                    ],
                                    flags: "Ephemeral",
                                });
                            }
                            await main_1.main.prisma.myGuild.update({
                                where: { guildId: message.guild.id },
                                data: { rooms: selectedChannel },
                            });
                            await interaction
                                .update({
                                embeds: [
                                    new embeds_extend_1.EmbedCorrect().setDescription([
                                        `${client.getEmoji(message.guild.id, "correct")} The rooms system has been successfully enabled.`,
                                        `• **Usage:** \`${prefix}rooms disabled\` to disable the system.`,
                                    ].join("\n")),
                                ],
                                components: [],
                            })
                                .then(async () => {
                                const category = await message.guild?.channels.create({
                                    name: "Rooms",
                                    type: discord_js_1.ChannelType.GuildCategory,
                                    permissionOverwrites: [
                                        {
                                            id: message.guild.roles.everyone.id,
                                            deny: ["ViewChannel"],
                                        },
                                        {
                                            id: client.user?.id || "",
                                            allow: ["ViewChannel", "SendMessages", "Connect", "Speak"],
                                        },
                                    ],
                                });
                                await main_1.main.prisma.myGuild.update({
                                    where: { guildId: message.guild?.id },
                                    data: { roomcategory: category?.id },
                                });
                            });
                        }
                        else if (interaction.isButton()) {
                            switch (interaction.customId) {
                                case "rooms-confirm-selection":
                                    {
                                        await interaction.deferUpdate();
                                    }
                                    break;
                                case "rooms-cancel-selection":
                                    {
                                        await interaction.update({
                                            embeds: [
                                                new embeds_extend_1.EmbedCorrect()
                                                    .setDescription([
                                                    `${client.getEmoji(message.guild.id, "correct")} The rooms system configuration has been canceled.`,
                                                    `• **Usage:** \`${prefix}rooms enabled <channel_id>\` to re-enable the system.`,
                                                ].join("\n"))
                                                    .setTitle("Rooms System - Canceled"),
                                            ],
                                            components: [],
                                        });
                                    }
                                    break;
                            }
                        }
                        return;
                    });
                }
                break;
            case "disabled":
                {
                    const data = await main_1.main.prisma.myGuild.update({
                        where: { guildId: message.guild.id },
                        data: { rooms: null },
                    });
                    const embed = new embeds_extend_1.EmbedCorrect()
                        .setTitle("Rooms System - Disabled")
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "correct")} The rooms system has been successfully disabled.`,
                        `• **Usage:** \`${prefix}rooms enabled <channel_id>\` to re-enable the system.`,
                    ].join("\n"));
                    const msg = await message.channel.send({
                        embeds: [embed],
                        components: [
                            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                                .setLabel("Re-enable")
                                .setStyle(discord_js_1.ButtonStyle.Primary)
                                .setEmoji(client.getEmoji(message.guild.id, "reply"))
                                .setCustomId("rooms-reenable")),
                        ],
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter: (i) => i.user.id === message.author.id,
                        time: 60000,
                    });
                    collector.on("collect", async (interaction) => {
                        if (!message.guild || !message.channel || !client.user)
                            return;
                        if (interaction.isButton()) {
                            switch (interaction.customId) {
                                case "rooms-reenable":
                                    {
                                        await interaction.deferUpdate();
                                        const channel = data.rooms ? message.guild.channels.cache.get(data.rooms) : null;
                                        await interaction.editReply({
                                            embeds: [
                                                new embeds_extend_1.EmbedCorrect()
                                                    .setTitle("Rooms System - Re-enabled")
                                                    .setDescription([
                                                    `${client.getEmoji(message.guild.id, "correct")} The rooms system has been successfully re-enabled.`,
                                                    `**Current Channel:** ${channel ? channel.toString() : "Not set"}`,
                                                    `**Usage:**`,
                                                    `• \`${prefix}rooms enabled <channel_id>\``,
                                                ].join("\n")),
                                            ],
                                            components: [],
                                        });
                                    }
                                    break;
                            }
                        }
                    });
                }
                break;
            default:
                {
                    const data = await main_1.main.prisma.myGuild.findFirst({
                        where: { guildId: message.guild.id },
                    });
                    if (!data)
                        return message.channel.send({
                            embeds: [
                                new embeds_extend_1.ErrorEmbed()
                                    .setTitle("Error Rooms - Systems")
                                    .setDescription([
                                    `${client.getEmoji(message.guild.id, "error")} An error occurred while trying to fetch the rooms system data.`,
                                    `Please try again later or contact the support team.`,
                                ].join("\n")),
                            ],
                        });
                    const channel = data.rooms ? message.guild.channels.cache.get(data.rooms) : null;
                    const msg = await message.channel.send({
                        embeds: [
                            new embeds_extend_1.EmbedCorrect()
                                .setTitle("Rooms System - Configuration")
                                .setDescription([
                                `**Status:** ${data.rooms === null ? "Disabled" : "Enabled"}`,
                                `**Channel:** ${channel ? channel.toString() : "Not set"}`,
                                `**Usage:**`,
                                `• \`${prefix}rooms enabled <channel_id>\``,
                                `• \`${prefix}rooms disabled\``,
                            ].join("\n")),
                        ],
                        components: [
                            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                                .setLabel("Disable System")
                                .setStyle(discord_js_1.ButtonStyle.Danger)
                                .setEmoji(client.getEmoji(message.guild.id, "circle_x"))
                                .setCustomId("rooms-disabled"), new discord_js_1.ButtonBuilder()
                                .setLabel("Modify Channel")
                                .setStyle(discord_js_1.ButtonStyle.Primary)
                                .setEmoji(client.getEmoji(message.guild.id, "file"))
                                .setCustomId("rooms-modify-channel")),
                        ],
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter: (i) => i.user.id === message.author.id,
                        time: 60000,
                    });
                    collector.on("collect", async (interaction) => {
                        if (!message.guild || !message.channel || !client.user)
                            return;
                        if (interaction.isButton()) {
                            switch (interaction.customId) {
                                case "rooms-disabled":
                                    {
                                        await interaction.deferUpdate();
                                        await main_1.main.prisma.myGuild.update({
                                            where: { guildId: message.guild.id },
                                            data: { rooms: null },
                                        });
                                        await msg.edit({
                                            embeds: [
                                                new embeds_extend_1.EmbedCorrect()
                                                    .setTitle("Rooms System - Disabled")
                                                    .setDescription(`${client.getEmoji(message.guild.id, "correct")} The rooms system has been successfully disabled.`),
                                            ],
                                            components: [],
                                        });
                                    }
                                    break;
                                case "rooms-modify-channel":
                                    {
                                        await interaction.deferUpdate();
                                        const channel = data.rooms ? message.guild.channels.cache.get(data.rooms) : null;
                                        await msg.edit({
                                            embeds: [
                                                new embeds_extend_1.EmbedCorrect()
                                                    .setTitle("Rooms System - Modify Channel")
                                                    .setDescription([
                                                    `${client.getEmoji(message.guild.id, "correct")} You are in the voice room system configuration menu now.`,
                                                    `Please select the channel where you want to create the rooms.`,
                                                    `**Current Channel:** ${channel ? channel.toString() : "Not set"}`,
                                                ].join("\n")),
                                            ],
                                            components: [
                                                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ChannelSelectMenuBuilder()
                                                    .setCustomId("rooms-menu-config")
                                                    .setPlaceholder("Select a voice channel")
                                                    .setChannelTypes(discord_js_1.ChannelType.GuildVoice)
                                                    .setMaxValues(1)),
                                                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                                                    .setLabel("Confirm Selection")
                                                    .setStyle(discord_js_1.ButtonStyle.Success)
                                                    .setEmoji(client.getEmoji(message.guild.id, "circle_check"))
                                                    .setCustomId("rooms-confirm-selection"), new discord_js_1.ButtonBuilder()
                                                    .setLabel("Cancel")
                                                    .setStyle(discord_js_1.ButtonStyle.Danger)
                                                    .setEmoji(client.getEmoji(message.guild.id, "circle_x"))
                                                    .setCustomId("rooms-cancel-selection")),
                                            ],
                                        });
                                    }
                                    break;
                            }
                        }
                    });
                }
                break;
        }
        return;
    },
};
module.exports = roomsCommand;
//# sourceMappingURL=rooms.js.map
//# debugId=3e47e207-7e55-5674-a13c-529e0953ecfc
