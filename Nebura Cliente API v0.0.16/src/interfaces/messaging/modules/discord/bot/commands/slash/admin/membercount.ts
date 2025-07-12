import {
	ActionRowBuilder, ApplicationIntegrationType, ButtonBuilder, ButtonStyle,
	ChannelSelectMenuBuilder, ChannelType, EmbedBuilder, ModalBuilder, ModalSubmitInteraction,
	PermissionFlagsBits, SlashCommandBuilder, StringSelectMenuBuilder, TextInputBuilder,
	TextInputStyle
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { config } from "@utils/config";

export default new Command(
  new SlashCommandBuilder()
    .setName("membercount")
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setNameLocalizations({
      "es-ES": "contador-miembros",
    })
    .setDescription("Configure the member count channels and messages.")
    .setDescriptionLocalizations({
      "es-ES": "Configura los canales y mensajes de conteo de miembros.",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async (_client, interaction) => {
    if (!interaction.guild) return;

    const guildId = interaction.guild.id;
    const lang = interaction.locale || interaction.guildLocale || "en-US";

    // Step 1: Select which channel configuration to edit
    const embed = new EmbedBuilder()
      .setTitle(_client.t("discord:membercount.configTitle", { lng: lang }))
      .setDescription(_client.t("discord:membercount.configDesc", { lng: lang }))
      .setColor("Blue");

    const configSlots = Array.from({ length: 5 }, (_, i) => ({
      label: _client.t("discord:membercount.configSlotLabel", { slot: i + 1, lng: lang }),
      value: `membercount_channel${i + 1}`,
    }));

    const configMenu = new StringSelectMenuBuilder()
      .setCustomId("select-config-slot")
      .setPlaceholder(_client.t("discord:membercount.configMenuPlaceholder", { lng: lang }))
      .addOptions(configSlots);

    const configRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(configMenu);

    await interaction.reply({
      embeds: [embed],
      components: [configRow],
      flags: "Ephemeral",
    });

    const collector = interaction.channel?.createMessageComponentCollector({
      time: 60000,
    });

    let selectedConfigSlot: string | null = null;
    let selectedVoiceChannelId: string | null = null;
    let customMessage: string | null = null;

    collector?.on("collect", async (componentInteraction) => {
      if (!interaction.guild) return;

      if (componentInteraction.user.id !== interaction.user.id) {
        return componentInteraction.reply({
          content: _client.t("discord:membercount.noInteract", { lng: lang }),
          flags: "Ephemeral",
        });
      }

      // Step 2: Select the voice channel
      if (componentInteraction.isStringSelectMenu() && componentInteraction.customId === "select-config-slot") {
        selectedConfigSlot = componentInteraction.values[0];

        const currentConfig = await main.prisma.myGuild.findFirst({
          where: { guildId },
        });

        const currentChannel =
          currentConfig?.[selectedConfigSlot as keyof typeof currentConfig] ||
          _client.t("discord:membercount.notConfigured", { lng: lang });
        const currentMessage =
          currentConfig?.[selectedConfigSlot.replace("channel", "message") as keyof typeof currentConfig] ||
          "{members} members";

        const embed = new EmbedBuilder()
          .setTitle(_client.t("discord:membercount.configTitle", { lng: lang }))
          .setDescription(
            _client.t("discord:membercount.slotSelected", {
              slot: selectedConfigSlot,
              currentChannel,
              currentMessage,
              lng: lang,
            }),
          )
          .setColor("Blue");

        const channelMenu = new ChannelSelectMenuBuilder()
          .setCustomId("select-voice-channel")
          .setPlaceholder(_client.t("discord:membercount.channelMenuPlaceholder", { lng: lang }))
          .setChannelTypes(ChannelType.GuildVoice);

        const channelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu);

        await componentInteraction.update({
          embeds: [embed],
          components: [channelRow],
        });
      }

      // Step 3: Provide a custom message or use default
      if (componentInteraction.isChannelSelectMenu() && componentInteraction.customId === "select-voice-channel") {
        selectedVoiceChannelId = componentInteraction.values[0];

        const embed = new EmbedBuilder()
          .setTitle(_client.t("discord:membercount.configTitle", { lng: lang }))
          .setDescription(
            _client.t("discord:membercount.channelSelected", {
              channel: selectedVoiceChannelId,
              defaultMessage: "{members} members",
              lng: lang,
            }),
          )
          .setColor("Blue");

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("provide-custom-message")
            .setLabel(_client.t("discord:membercount.provideCustomMessage", { lng: lang }))
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("use-default-message")
            .setLabel(_client.t("discord:membercount.useDefaultMessage", { lng: lang }))
            .setStyle(ButtonStyle.Success),
        );

        await componentInteraction.update({
          embeds: [embed],
          components: [buttonRow],
        });
      }

      // Step 4: Handle custom message input
      if (componentInteraction.isButton()) {
        if (componentInteraction.customId === "provide-custom-message") {
          const modal = new ModalBuilder()
            .setCustomId("custom-message-modal")
            .setTitle(_client.t("discord:membercount.customMessageModalTitle", { lng: lang }));

          const messageInput = new TextInputBuilder()
            .setCustomId("custom-message-input")
            .setLabel(_client.t("discord:membercount.customMessageInputLabel", { lng: lang }))
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("{members} members")
            .setRequired(true);

          const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
          modal.addComponents(modalRow);

          await componentInteraction.showModal(modal);
        } else if (componentInteraction.customId === "use-default-message") {
          customMessage = "{members} members";

          const embed = new EmbedBuilder()
            .setTitle(_client.t("discord:membercount.confirmTitle", { lng: lang }))
            .setDescription(
              _client.t("discord:membercount.confirmDesc", {
                slot: selectedConfigSlot,
                channel: selectedVoiceChannelId,
                message: customMessage,
                lng: lang,
              }),
            )
            .setColor("Blue");

          const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("save-configuration")
              .setLabel(_client.t("discord:membercount.saveButton", { lng: lang }))
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId("cancel-configuration")
              .setLabel(_client.t("discord:membercount.cancelButton", { lng: lang }))
              .setStyle(ButtonStyle.Danger),
          );

          await componentInteraction.update({
            embeds: [embed],
            components: [confirmRow],
          });
        }
      }

      if (
        componentInteraction.isModalSubmit() &&
        (componentInteraction as ModalSubmitInteraction).customId === "custom-message-modal"
      ) {
        customMessage = (componentInteraction as ModalSubmitInteraction).fields.getTextInputValue(
          "custom-message-input",
        );

        const embed = new EmbedBuilder()
          .setTitle(_client.t("discord:membercount.confirmTitle", { lng: lang }))
          .setDescription(
            _client.t("discord:membercount.confirmDesc", {
              slot: selectedConfigSlot,
              channel: selectedVoiceChannelId,
              message: customMessage,
              lng: lang,
            }),
          )
          .setColor("Blue");

        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("save-configuration")
            .setLabel(_client.t("discord:membercount.saveButton", { lng: lang }))
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("cancel-configuration")
            .setLabel(_client.t("discord:membercount.cancelButton", { lng: lang }))
            .setStyle(ButtonStyle.Danger),
        );

        await (componentInteraction as ModalSubmitInteraction).reply({
          embeds: [embed],
          components: [confirmRow],
          flags: "Ephemeral",
        });
      }

      if (componentInteraction.isButton()) {
        if (componentInteraction.customId === "save-configuration") {
          await main.prisma.myGuild.upsert({
            where: { guildId },
            update: {
              [selectedConfigSlot!]: selectedVoiceChannelId,
              [selectedConfigSlot!.replace("channel", "message")]: customMessage,
            },
            create: {
              guildId,
              discordId: config.modules.discord.id,
              [selectedConfigSlot!]: selectedVoiceChannelId,
              [selectedConfigSlot!.replace("channel", "message")]: customMessage,
            },
          });

          await componentInteraction.update({
            content: _client.t("discord:membercount.saved", { lng: lang }),
            embeds: [],
            components: [],
          });
        } else if (componentInteraction.customId === "cancel-configuration") {
          await componentInteraction.update({
            content: _client.t("discord:membercount.cancelled", { lng: lang }),
            embeds: [],
            components: [],
          });
        }
      }

      return;
    });

    collector?.on("end", async () => {
      await interaction.editReply({
        components: [],
      });
    });

    return;
  },
);
