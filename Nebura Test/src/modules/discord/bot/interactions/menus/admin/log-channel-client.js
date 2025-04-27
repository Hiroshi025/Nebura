"use strict";
const main_1 = require("../../../../../../main");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const logChannelClient = {
    id: "select-log-channel",
    maintenance: false,
    cooldown: 10,
    tickets: false,
    owner: false,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel || !interaction.member)
            return;
        const channelId = interaction.values[0];
        await main_1.main.prisma.myDiscord.update({
            where: { clientId: client.user?.id },
            data: { logchannel: channelId },
        });
        await interaction.update({
            embeds: [
                new embeds_extender_1.EmbedCorrect()
                    .setTitle("Configuration")
                    .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                    `The log channel has been successfully set to <#${channelId}>.`),
            ],
            components: [],
        });
    },
};
module.exports = logChannelClient;
