"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="2178b6f1-2b90-560b-8766-d682f3e63c05")}catch(e){}}();

const discord_js_1 = require("discord.js");
const setWebhookConfig = {
    id: "button-set-webhook-config",
    tickets: false,
    owner: true,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction) {
        if (!interaction.guild || !interaction.channel)
            return;
        const i = interaction;
        const input = new discord_js_1.TextInputBuilder()
            .setCustomId("input-webhook-url")
            .setLabel("Webhook URL")
            .setStyle(1)
            .setPlaceholder("Enter the webhook URL")
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(2000);
        const row = new discord_js_1.ActionRowBuilder().addComponents(input);
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId("modal-webhook-config")
            .setTitle("Webhook Configuration")
            .addComponents(row);
        await i.showModal(modal);
    },
};
module.exports = setWebhookConfig;
//# sourceMappingURL=set.js.map
//# debugId=2178b6f1-2b90-560b-8766-d682f3e63c05
