import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { Buttons } from "@typings/modules/discord";

const ButtonModalSearch: Buttons = {
  id: "help_search",
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

    const searchInput = new TextInputBuilder()
      .setCustomId("search_query")
      .setLabel(client.t("help.searchModalLabel", {}, lang))
      .setPlaceholder(client.t("help.searchModalPlaceholder", {}, lang))
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(searchInput);
    searchModal.addComponents(modalRow);

    await interaction.showModal(searchModal);
  },
};

export default ButtonModalSearch;
