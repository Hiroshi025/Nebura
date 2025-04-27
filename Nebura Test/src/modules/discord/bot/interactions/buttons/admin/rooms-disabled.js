"use strict";
const main_1 = require("../../../../../../main");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const setRoomsDisabled = {
    id: "rooms:button-disabled",
    tickets: false,
    owner: false,
    cooldown: 10,
    permissions: ["ManageChannels"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const data = await main_1.main.prisma.myGuild.findUnique({
            where: { id: interaction.guild.id },
        });
        if (!data)
            return interaction.reply({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Error Rooms - Systems")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} An error occurred while trying to disable the rooms system.`,
                        `Please try again later or contact the support team.`,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        if (data.rooms === null)
            return interaction.reply({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Error Rooms - Systems")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} The rooms system is already disabled.`,
                        `**Usage:** \`${process.env.PREFIX}rooms enabled <channel_id>\``,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        await main_1.main.prisma.myGuild.update({
            where: { id: interaction.guild.id },
            data: {
                rooms: null,
            },
        });
        interaction.reply({
            embeds: [
                new embeds_extender_1.EmbedCorrect()
                    .setTitle("Rooms System - Disabled")
                    .setDescription([
                    `${client.getEmoji(interaction.guild.id, "correct")} The rooms system has been disabled successfully.`,
                    `**Usage:** \`${process.env.PREFIX}rooms enabled <channel_id>\``,
                ].join("\n")),
            ],
            flags: "Ephemeral",
        });
        return;
    },
};
module.exports = setRoomsDisabled;
