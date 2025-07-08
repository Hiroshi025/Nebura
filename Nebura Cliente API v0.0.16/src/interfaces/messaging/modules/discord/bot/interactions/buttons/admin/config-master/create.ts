import { ActionRowBuilder, ChannelSelectMenuBuilder } from "discord.js";

import { Buttons } from "@typings/modules/discord";
import { EmbedCorrect } from "@utils/extends/embeds.extension";

const webhookConfig: Buttons = {
  id: "button-create-webhook-config",
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const i = interaction;
    await i.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle("Configuration")
          .setDescription(
            `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
              `You have selected the create webhook option.`,
          ),
      ],
      components: [
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId("select-webhook-channel")
            .setPlaceholder("Select a channel to create the webhook")
            .setChannelTypes([0]), // 0 = GUILD_TEXT
        ),
      ],
    });
  },
};

export = webhookConfig;
