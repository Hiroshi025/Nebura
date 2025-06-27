"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="1cbaa177-b8dc-5349-8a8b-02c3a35a5c01")}catch(e){}}();

const discord_js_1 = require("discord.js");
const embeds_extend_1 = require("../../../../../../../../../shared/adapters/extends/embeds.extend");
const webhookConfig = {
    id: "button-create-webhook-config",
    tickets: false,
    owner: true,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const i = interaction;
        await i.reply({
            embeds: [
                new embeds_extend_1.EmbedCorrect()
                    .setTitle("Configuration")
                    .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                    `You have selected the create webhook option.`),
            ],
            components: [
                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("select-webhook-channel")
                    .setPlaceholder("Select a channel to create the webhook")
                    .setChannelTypes([0])),
            ],
        });
    },
};
module.exports = webhookConfig;
//# sourceMappingURL=create.js.map
//# debugId=1cbaa177-b8dc-5349-8a8b-02c3a35a5c01
