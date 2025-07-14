import {
	ActionRowBuilder, ApplicationIntegrationType, ButtonBuilder, ButtonStyle,
	ChannelSelectMenuBuilder, ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";

export default new Command(
  new SlashCommandBuilder()
    .setName("suggest-config")
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
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

    // Multilenguaje
    const userLang = interaction.guild.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = _client.translations.getFixedT(lang, "discord");

    // Embed inicial para configurar el canal de sugerencias
    const embed = new EmbedBuilder()
      .setTitle(t("suggest.configTitle"))
      .setDescription(t("suggest.configDesc"))
      .setColor("Blue");

    const channelMenu = new ChannelSelectMenuBuilder()
      .setCustomId("select-suggestion-channel")
      .setPlaceholder(t("suggest.selectChannel"))
      .setChannelTypes(ChannelType.GuildText);

    const disableButton = new ButtonBuilder()
      .setCustomId("disable-suggestions")
      .setLabel(t("suggest.disableButton"))
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu);

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(disableButton);

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      flags: "Ephemeral",
    });

    const collector = interaction.channel?.createMessageComponentCollector({
      time: 60000,
    });

    collector?.on("collect", async (componentInteraction) => {
      if (componentInteraction.user.id !== interaction.user.id) {
        return componentInteraction.reply({
          content: t("suggest.noInteract"),
          flags: "Ephemeral",
        });
      }

      if (componentInteraction.isChannelSelectMenu() && componentInteraction.customId === "select-suggestion-channel") {
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
          content: t("suggest.setChannel", { channel: `<#${selectedChannelId}>` }),
          embeds: [],
          components: [],
        });
      }

      if (componentInteraction.isButton() && componentInteraction.customId === "disable-suggestions") {
        await main.prisma.myGuild.update({
          where: { guildId },
          data: { suggestChannel: null },
        });

        await componentInteraction.update({
          content: t("suggest.disabled"),
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
