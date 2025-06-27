"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="dbc63ce0-684e-507f-b84d-9b10c58a6fd4")}catch(e){}}();

const discord_js_1 = require("discord.js");
const AdvancedSearchCommand = {
    id: "open_search_modal",
    tickets: false,
    owner: false,
    permissions: ["ManageChannels"],
    botpermissions: ["SendMessages"],
    async execute(interaction, _client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const searchModal = new discord_js_1.ModalBuilder()
            .setCustomId(`search_modal`)
            .setTitle("Command Search");
        const searchInput = new discord_js_1.TextInputBuilder()
            .setCustomId("search_query")
            .setLabel("Search for commands")
            .setPlaceholder("Enter command name, alias, or description...")
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true);
        const modalRow = new discord_js_1.ActionRowBuilder().addComponents(searchInput);
        searchModal.addComponents(modalRow);
        await interaction.showModal(searchModal);
    },
};
module.exports = AdvancedSearchCommand;
//# sourceMappingURL=advanced-search.js.map
//# debugId=dbc63ce0-684e-507f-b84d-9b10c58a6fd4
