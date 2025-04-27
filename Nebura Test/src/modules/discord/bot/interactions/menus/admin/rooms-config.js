"use strict";
const main_1 = require("../../../../../../main");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const config_1 = require("../../../../../../shared/utils/config");
const setMenuRoom = {
    id: "rooms:menu-config",
    tickets: false,
    cooldown: 10,
    owner: false,
    permissions: ["ManageChannels"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const channelId = interaction.values[0];
        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel)
            return interaction.reply({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Error Rooms - Systems")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} An error occurred while trying to set the rooms system.`,
                        `Please try again later or contact the support team.`,
                    ].join("\n")),
                ],
                ephemeral: true,
            });
        await main_1.main.prisma.myGuild.update({
            where: { id: interaction.guild.id },
            data: {
                rooms: channelId,
            },
        });
        interaction.reply({
            embeds: [
                new embeds_extender_1.EmbedCorrect()
                    .setTitle("Rooms System - Enabled")
                    .setDescription([
                    `${client.getEmoji(interaction.guild.id, "correct")} The rooms system has been enabled successfully.`,
                    `**Channel:** <#${channelId}>`,
                    `**Usage:**`,
                    `• \`${config_1.config.modules.discord.prefix}rooms disabled\``,
                    `• \`${config_1.config.modules.discord.prefix}rooms enabled <channel_id>\``,
                ].join("\n")),
            ],
            ephemeral: true,
        });
        return;
    },
};
module.exports = setMenuRoom;
