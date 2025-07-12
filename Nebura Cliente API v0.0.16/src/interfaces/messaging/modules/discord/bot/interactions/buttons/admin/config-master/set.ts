import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "discord.js";

import { Buttons } from "@typings/modules/discord";

const setWebhookConfig: Buttons = {
  id: "button-set-webhook-config",
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction) {
    if (!interaction.guild || !interaction.channel) return;
    const i = interaction;
    const input = new TextInputBuilder()
      .setCustomId("input-webhook-url")
      .setLabel("Webhook URL")
      .setStyle(1)
      .setPlaceholder("Enter the webhook URL")
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(2000);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    const modal = new ModalBuilder()
      .setCustomId("modal-webhook-config")
      .setTitle("Webhook Configuration")
      .addComponents(row);

    await i.showModal(modal);
  },
};

export default setWebhookConfig;
