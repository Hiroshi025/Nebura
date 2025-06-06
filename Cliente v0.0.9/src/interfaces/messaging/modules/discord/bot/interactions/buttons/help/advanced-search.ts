import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { Buttons } from "@typings/modules/discord";

const AdvancedSearchCommand: Buttons = {
  id: "open_search_modal",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, _client) {
    if (!interaction.guild || !interaction.channel) return;
        const searchModal = new ModalBuilder()
          .setCustomId(`search_modal`)
          .setTitle("Command Search");
    
        const searchInput = new TextInputBuilder()
          .setCustomId("search_query")
          .setLabel("Search for commands")
          .setPlaceholder("Enter command name, alias, or description...")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);
    
        const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(searchInput);
        searchModal.addComponents(modalRow);
    
        await interaction.showModal(searchModal);
  },
};

export = AdvancedSearchCommand;