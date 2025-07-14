import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "discord.js";

import { TextInputRow } from "@shared/utils/extends/discord/modal.extends";
import { Buttons } from "@typings/modules/discord";

const AdvancedSearchCommand: Buttons = {
  id: "open_search_modal",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const lang = interaction.locale || interaction.guildLocale || "es-ES";
    const searchModal = new ModalBuilder()
      .setCustomId(`search_modal`)
      .setTitle(client.t("help.searchModalTitle", {}, lang));

    const searchInput = new TextInputRow(true)
      .setCustomId("search_query")
      .setLabel(client.t("help.searchModalLabel", {}, lang))
      .setPlaceholder(client.t("help.searchModalPlaceholder", {}, lang));

    const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(searchInput);
    searchModal.addComponents(modalRow);

    await interaction.showModal(searchModal);
  },
};

export default AdvancedSearchCommand;
