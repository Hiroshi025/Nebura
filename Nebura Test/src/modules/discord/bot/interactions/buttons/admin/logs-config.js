"use strict";
const discord_js_1 = require("discord.js");
const logSetButton = {
    id: "button-enabled-logevents",
    tickets: false,
    cooldown: 10,
    owner: false,
    permissions: ["Administrator"],
    botpermissions: ["Administrator"],
    async execute(interaction, _client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const i = interaction;
        const input = new discord_js_1.TextInputBuilder()
            .setCustomId("button-enabled-logevents-channelId")
            .setLabel("Channel ID")
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder("Enter the Channel ID")
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(2000);
        const input2 = new discord_js_1.TextInputBuilder()
            .setCustomId("button-enabled-logevents-events")
            .setLabel("Events to Log")
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder("Separate events with commas")
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(2000);
        const row = new discord_js_1.ActionRowBuilder().addComponents(input);
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(input2);
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId("button-enabled-logevents-modal")
            .setTitle("Logs Configuration")
            .addComponents(row)
            .addComponents(row2);
        await i.showModal(modal);
    },
};
module.exports = logSetButton;
