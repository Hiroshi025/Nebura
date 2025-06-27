"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="09ee2cca-90e5-5b74-b522-37b3db2a5b45")}catch(e){}}();

const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
/**
 * Interactive command to configure the NSFW channel for the server.
 * Allows admins to select a text channel as the NSFW channel using a channel select menu and confirm/cancel buttons.
 */
const autonsfwCommand = {
    name: "autonsfw",
    description: "Configure the NSFW channel for this server.",
    examples: ["autonsfw"],
    nsfw: false,
    owner: false,
    cooldown: 30,
    aliases: ["setnsfw", "nsfwchannel"],
    botpermissions: ["SendMessages", "ManageChannels"],
    permissions: ["Administrator"],
    async execute(_client, message, args) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const subcommand = args[0];
        switch (subcommand) {
            case "set":
                {
                    // Fetch all text channels with strong typing
                    const textChannels = message.guild.channels.cache
                        .filter((ch) => ch.type === discord_js_1.ChannelType.GuildText &&
                        ch.viewable &&
                        ch.permissionsFor(message.guild.members.me)?.has(discord_js_1.PermissionFlagsBits.SendMessages))
                        .map((ch) => ch);
                    if (textChannels.length === 0) {
                        return message.reply({
                            embeds: [
                                new embeds_extend_1.ErrorEmbed()
                                    .setTitle("No Text Channels Found")
                                    .setDescription("There are no text channels available to set as NSFW."),
                            ],
                        });
                    }
                    // Channel select menu (only text channels)
                    const selectMenu = new discord_js_1.ChannelSelectMenuBuilder()
                        .setCustomId("autonsfw_select")
                        .setPlaceholder("Select a channel to set as NSFW")
                        .setChannelTypes(discord_js_1.ChannelType.GuildText)
                        .setMinValues(1)
                        .setMaxValues(1);
                    const confirmButton = new discord_js_1.ButtonBuilder()
                        .setCustomId("autonsfw_confirm")
                        .setLabel("Confirm")
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setDisabled(true);
                    const cancelButton = new discord_js_1.ButtonBuilder()
                        .setCustomId("autonsfw_cancel")
                        .setLabel("Cancel")
                        .setStyle(discord_js_1.ButtonStyle.Danger);
                    const rowMenu = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    const rowButtons = new discord_js_1.ActionRowBuilder().addComponents(confirmButton, cancelButton);
                    const embed = new embeds_extend_1.EmbedCorrect()
                        .setTitle("NSFW Channel Configuration")
                        .setDescription("Please select a text channel to set as the NSFW channel for this server.");
                    const sentMsg = await message.channel.send({
                        embeds: [embed],
                        components: [rowMenu, rowButtons],
                    });
                    let selectedChannelId = null;
                    const collector = sentMsg.createMessageComponentCollector({
                        filter: (i) => i.user.id === message.author.id,
                        time: 60_000,
                    });
                    collector.on("collect", async (interaction) => {
                        if (interaction.isChannelSelectMenu() && interaction.customId === "autonsfw_select") {
                            const channelId = interaction.values[0];
                            const selectedChannel = message.guild.channels.cache.get(channelId);
                            if (!selectedChannel || selectedChannel.type !== discord_js_1.ChannelType.GuildText) {
                                return interaction.reply({
                                    content: "Invalid channel selected.",
                                    ephemeral: true,
                                });
                            }
                            selectedChannelId = channelId;
                            // Enable confirm button
                            const updatedConfirm = discord_js_1.ButtonBuilder.from(confirmButton).setDisabled(false);
                            const updatedRowButtons = new discord_js_1.ActionRowBuilder().addComponents(updatedConfirm, cancelButton);
                            await interaction.update({
                                components: [rowMenu, updatedRowButtons],
                            });
                        }
                        else if (interaction.isButton()) {
                            if (interaction.customId === "autonsfw_confirm") {
                                if (!selectedChannelId) {
                                    return interaction.reply({
                                        content: "Please select a channel first.",
                                        flags: "Ephemeral",
                                    });
                                }
                                // Update DB
                                await main_1.main.prisma.myGuild.update({
                                    where: { guildId: message.guild.id },
                                    data: { nsfwChannel: selectedChannelId },
                                });
                                await interaction.update({
                                    embeds: [
                                        new embeds_extend_1.EmbedCorrect()
                                            .setTitle("NSFW Channel Set")
                                            .setDescription(`The NSFW channel has been set to <#${selectedChannelId}>.`),
                                    ],
                                    components: [],
                                });
                                collector.stop();
                            }
                            else if (interaction.customId === "autonsfw_cancel") {
                                await interaction.update({
                                    embeds: [
                                        new embeds_extend_1.ErrorEmbed()
                                            .setTitle("NSFW Channel Configuration Cancelled")
                                            .setDescription("The NSFW channel configuration has been cancelled."),
                                    ],
                                    components: [],
                                });
                                collector.stop();
                            }
                        }
                        return;
                    });
                    collector.on("end", async (_, reason) => {
                        if (reason === "time") {
                            await sentMsg.edit({
                                embeds: [
                                    new embeds_extend_1.EmbedCorrect()
                                        .setTitle("NSFW Channel Configuration Expired")
                                        .setDescription("You did not respond in time. Please run the command again if you wish to configure the NSFW channel."),
                                ],
                                components: [],
                            });
                        }
                    });
                }
                break;
            case "remove":
                {
                    // Get current NSFW channel
                    const myGuild = await main_1.main.prisma.myGuild.findUnique({
                        where: { guildId: message.guild.id },
                    });
                    if (!myGuild?.nsfwChannel) {
                        return message.reply({
                            embeds: [
                                new embeds_extend_1.ErrorEmbed()
                                    .setTitle("No NSFW Channel Configured")
                                    .setDescription("There is no NSFW channel configured for this server."),
                            ],
                        });
                    }
                    const confirmButton = new discord_js_1.ButtonBuilder()
                        .setCustomId("autonsfw_remove_confirm")
                        .setLabel("Confirm Remove")
                        .setStyle(discord_js_1.ButtonStyle.Danger);
                    const cancelButton = new discord_js_1.ButtonBuilder()
                        .setCustomId("autonsfw_remove_cancel")
                        .setLabel("Cancel")
                        .setStyle(discord_js_1.ButtonStyle.Secondary);
                    const row = new discord_js_1.ActionRowBuilder().addComponents(confirmButton, cancelButton);
                    const embed = new embeds_extend_1.EmbedCorrect()
                        .setTitle("Remove NSFW Channel")
                        .setDescription(`Are you sure you want to remove the configured NSFW channel (<#${myGuild.nsfwChannel}>)?`);
                    const sentMsg = await message.channel.send({
                        embeds: [embed],
                        components: [row],
                    });
                    const collector = sentMsg.createMessageComponentCollector({
                        filter: (i) => i.user.id === message.author.id,
                        time: 60_000,
                    });
                    collector.on("collect", async (interaction) => {
                        if (interaction.isButton()) {
                            if (interaction.customId === "autonsfw_remove_confirm") {
                                await main_1.main.prisma.myGuild.update({
                                    where: { guildId: message.guild.id },
                                    data: { nsfwChannel: null },
                                });
                                await interaction.update({
                                    embeds: [
                                        new embeds_extend_1.EmbedCorrect()
                                            .setTitle("NSFW Channel Removed")
                                            .setDescription("The NSFW channel configuration has been removed."),
                                    ],
                                    components: [],
                                });
                                collector.stop();
                            }
                            else if (interaction.customId === "autonsfw_remove_cancel") {
                                await interaction.update({
                                    embeds: [
                                        new embeds_extend_1.ErrorEmbed()
                                            .setTitle("NSFW Channel Removal Cancelled")
                                            .setDescription("The NSFW channel removal has been cancelled."),
                                    ],
                                    components: [],
                                });
                                collector.stop();
                            }
                        }
                    });
                    collector.on("end", async (_, reason) => {
                        if (reason === "time") {
                            await sentMsg.edit({
                                embeds: [
                                    new embeds_extend_1.EmbedCorrect()
                                        .setTitle("NSFW Channel Removal Expired")
                                        .setDescription("You did not respond in time. Please run the command again if you wish to remove the NSFW channel."),
                                ],
                                components: [],
                            });
                        }
                    });
                }
                break;
        }
        return;
    },
};
module.exports = autonsfwCommand;
//# sourceMappingURL=autonsfw.js.map
//# debugId=09ee2cca-90e5-5b74-b522-37b3db2a5b45
