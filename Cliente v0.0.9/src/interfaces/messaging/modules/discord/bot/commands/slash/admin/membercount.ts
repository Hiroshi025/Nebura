import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType,
	EmbedBuilder, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, SlashCommandBuilder,
	StringSelectMenuBuilder, TextInputBuilder, TextInputStyle
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { config } from "@utils/config";

export default new Command(
  new SlashCommandBuilder()
    .setName("membercount")
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

    // Step 1: Select which channel configuration to edit
    const embed = new EmbedBuilder()
      .setTitle("📊 Member Count Configuration")
      .setDescription("Select which configuration slot you want to edit.")
      .setColor("Blue");

    const configSlots = Array.from({ length: 5 }, (_, i) => ({
      label: `Configuration Slot ${i + 1}`,
      value: `membercount_channel${i + 1}`,
    }));

    const configMenu = new StringSelectMenuBuilder()
      .setCustomId("select-config-slot")
      .setPlaceholder("Select a configuration slot")
      .addOptions(configSlots);

    const configRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(configMenu);

    await interaction.reply({
      embeds: [embed],
      components: [configRow],
      ephemeral: true,
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
          content: "You cannot interact with this configuration.",
          ephemeral: true,
        });
      }

      // Step 2: Select the voice channel
      if (
        componentInteraction.isStringSelectMenu() &&
        componentInteraction.customId === "select-config-slot"
      ) {
        selectedConfigSlot = componentInteraction.values[0];

        const currentConfig = await main.prisma.myGuild.findFirst({
          where: { guildId },
        });

        const currentChannel =
          currentConfig?.[selectedConfigSlot as keyof typeof currentConfig] || "Not configured";
        const currentMessage =
          currentConfig?.[
            selectedConfigSlot.replace("channel", "message") as keyof typeof currentConfig
          ] || "{members} members";

        const embed = new EmbedBuilder()
          .setTitle("📊 Member Count Configuration")
          .setDescription(
            `You selected **${selectedConfigSlot}**.\n\n` +
              `**Current Configuration:**\n` +
              `- **Channel:** ${currentChannel}\n` +
              `- **Message:** ${currentMessage}\n\n` +
              `Now, select a voice channel to use for this configuration.`,
          )
          .setColor("Blue");

        const channelMenu = new ChannelSelectMenuBuilder()
          .setCustomId("select-voice-channel")
          .setPlaceholder("Select a voice channel")
          .setChannelTypes(ChannelType.GuildVoice);

        const channelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          channelMenu,
        );

        await componentInteraction.update({
          embeds: [embed],
          components: [channelRow],
        });
      }

      // Step 3: Provide a custom message or use default
      if (
        componentInteraction.isChannelSelectMenu() &&
        componentInteraction.customId === "select-voice-channel"
      ) {
        selectedVoiceChannelId = componentInteraction.values[0];

        const embed = new EmbedBuilder()
          .setTitle("📊 Member Count Configuration")
          .setDescription(
            `You selected the voice channel: <#${selectedVoiceChannelId}>.\n\n` +
              `Would you like to provide a custom message or use the default message (\`{members} members\`)?`,
          )
          .setColor("Blue");

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("provide-custom-message")
            .setLabel("📝 Provide Custom Message")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("use-default-message")
            .setLabel("✅ Use Default Message")
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
            .setTitle("Custom Message Configuration");

          const messageInput = new TextInputBuilder()
            .setCustomId("custom-message-input")
            .setLabel("Enter your custom message")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("{members} members")
            .setRequired(true);

          const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
          modal.addComponents(modalRow);

          await componentInteraction.showModal(modal);
        } else if (componentInteraction.customId === "use-default-message") {
          customMessage = "{members} members";

          const embed = new EmbedBuilder()
            .setTitle("📊 Confirm Configuration")
            .setDescription(
              `**Configuration Details:**\n` +
                `- **Slot:** ${selectedConfigSlot}\n` +
                `- **Voice Channel:** <#${selectedVoiceChannelId}>\n` +
                `- **Message:** ${customMessage}\n\n` +
                `Do you want to save this configuration?`,
            )
            .setColor("Blue");

          const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("save-configuration")
              .setLabel("💾 Save")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId("cancel-configuration")
              .setLabel("❌ Cancel")
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
          .setTitle("📊 Confirm Configuration")
          .setDescription(
            `**Configuration Details:**\n` +
              `- **Slot:** ${selectedConfigSlot}\n` +
              `- **Voice Channel:** <#${selectedVoiceChannelId}>\n` +
              `- **Message:** ${customMessage}\n\n` +
              `Do you want to save this configuration?`,
          )
          .setColor("Blue");

        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("save-configuration")
            .setLabel("💾 Save")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("cancel-configuration")
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Danger),
        );

        await (componentInteraction as ModalSubmitInteraction).reply({
          embeds: [embed],
          components: [confirmRow],
          ephemeral: true,
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
              discordId: config.modules.discord.clientId,
              [selectedConfigSlot!]: selectedVoiceChannelId,
              [selectedConfigSlot!.replace("channel", "message")]: customMessage,
            },
          });

          await componentInteraction.update({
            content: "✅ Configuration saved successfully!",
            embeds: [],
            components: [],
          });
        } else if (componentInteraction.customId === "cancel-configuration") {
          await componentInteraction.update({
            content: "❌ Configuration canceled.",
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
