import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { Buttons } from "@typings/modules/discord";

const logSetButton: Buttons = {
  id: "button-enabled-logevents",
  tickets: false,
  owner: false,
  permissions: ["Administrator"],
  botpermissions: ["Administrator"],
  async execute(interaction, _client) {
    if (!interaction.guild || !interaction.channel) return;
    const i = interaction;
    const input = new TextInputBuilder()
      .setCustomId("button-enabled-logevents-channelId")
      .setLabel("Channel ID")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Enter the Channel ID")
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(2000);

    const input2 = new TextInputBuilder()
      .setCustomId("button-enabled-logevents-events")
      .setLabel("Events to Log")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Separate events with commas")
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(2000);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(input2);

    const modal = new ModalBuilder()
      .setCustomId("button-enabled-logevents-modal")
      .setTitle("Logs Configuration")
      .addComponents(row)
      .addComponents(row2);

    await i.showModal(modal);
  },
};

export default logSetButton;
