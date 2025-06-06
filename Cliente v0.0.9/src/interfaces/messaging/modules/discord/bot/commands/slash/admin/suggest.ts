import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType,
	EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";

export default new Command(
  new SlashCommandBuilder()
    .setName("suggest-config")
    .setNameLocalizations({
      "es-ES": "config-sugerencias",
    })
    .setDescription("Configure the suggestion channel.")
    .setDescriptionLocalizations({
      "es-ES": "Configura el canal de sugerencias.",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async (_client, interaction) => {
    if (!interaction.guild) return;

    const guildId = interaction.guild.id;

    // Embed inicial para configurar el canal de sugerencias
    const embed = new EmbedBuilder()
      .setTitle("💡 Suggestion Channel Configuration")
      .setDescription("Select a channel to use for suggestions or disable the suggestion feature.")
      .setColor("Blue");

    const channelMenu = new ChannelSelectMenuBuilder()
      .setCustomId("select-suggestion-channel")
      .setPlaceholder("Select a channel")
      .setChannelTypes(ChannelType.GuildText);

    const disableButton = new ButtonBuilder()
      .setCustomId("disable-suggestions")
      .setLabel("Disable Suggestions")
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu);

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(disableButton);

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      ephemeral: true,
    });

    const collector = interaction.channel?.createMessageComponentCollector({
      time: 60000,
    });

    collector?.on("collect", async (componentInteraction) => {
      if (componentInteraction.user.id !== interaction.user.id) {
        return componentInteraction.reply({
          content: "You cannot interact with this configuration.",
          ephemeral: true,
        });
      }

      if (
        componentInteraction.isChannelSelectMenu() &&
        componentInteraction.customId === "select-suggestion-channel"
      ) {
        const selectedChannelId = componentInteraction.values[0];

        await main.prisma.myGuild.upsert({
          where: { guildId },
          update: { suggestChannel: selectedChannelId },
          create: {
            guildId,
            discordId: _client.user?.id || "",
            suggestChannel: selectedChannelId,
          },
        });

        await componentInteraction.update({
          content: `✅ Suggestion channel has been set to <#${selectedChannelId}>.`,
          embeds: [],
          components: [],
        });
      }

      if (
        componentInteraction.isButton() &&
        componentInteraction.customId === "disable-suggestions"
      ) {
        await main.prisma.myGuild.update({
          where: { guildId },
          data: { suggestChannel: null },
        });

        await componentInteraction.update({
          content: "❌ Suggestion feature has been disabled.",
          embeds: [],
          components: [],
        });
      }

      return;
    });

    collector?.on("end", async () => {
      await interaction.editReply({
        components: [],
      });
    });
  },
);
