"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="e5f7808e-9bbc-5088-bb6f-4d91bb1f2f4e")}catch(e){}}();

const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const logChannelClient = {
    id: "select-log-channel",
    maintenance: false,
    tickets: false,
    owner: false,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel || !interaction.member)
            return;
        const channelId = interaction.values[0];
        await main_1.main.prisma.discord.update({
            where: { clientId: client.user?.id },
            data: { logchannel: channelId },
        });
        await interaction.reply({
            embeds: [
                new embeds_extend_1.EmbedCorrect()
                    .setTitle("Configuration")
                    .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                    `The log channel has been successfully set to <#${channelId}>.`),
            ],
            components: [],
        });
    },
};
module.exports = logChannelClient;
//# sourceMappingURL=log-channel-client.js.map
//# debugId=e5f7808e-9bbc-5088-bb6f-4d91bb1f2f4e
