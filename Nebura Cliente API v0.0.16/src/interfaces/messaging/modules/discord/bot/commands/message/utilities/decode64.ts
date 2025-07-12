import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder,
	StringSelectMenuBuilder, TextInputBuilder, TextInputStyle
} from "discord.js";

import { EmbedCorrect } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const decode64Command: Precommand = {
  name: "decode64",
  description: "Decode Base64 text interactively",
  examples: ["decode64"],
  nsfw: false,
  owner: false,
  category: "Utilities",
  cooldown: 30,
  aliases: ["dec64", "base64decode"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Multilenguaje
    const userLang = message.guild?.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = client.translations.getFixedT(lang, "discord");

    // Create initial embed
    const embed = new EmbedCorrect()
      .setTitle(t("decode64.title"))
      .setDescription(t("decode64.desc"))
      .addFields({
        name: t("decode64.optionsField"),
        value: t("decode64.optionsValue"),
      });

    // Create action row with buttons
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("decode64_modal")
        .setLabel(t("decode64.useModal"))
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔘"),
      new ButtonBuilder()
        .setCustomId("decode64_paste")
        .setLabel(t("decode64.pasteHere"))
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📋"),
    );

    // Create select menu with recent messages
    const recentMessages = await message.channel.messages.fetch({ limit: 10 });
    const menuOptions = recentMessages.map((msg) => ({
      label: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""),
      value: msg.id,
      description: t("decode64.menuDesc", { user: msg.author.username }),
      emoji: "💬",
    }));

    const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("decode64_menu")
        .setPlaceholder(t("decode64.menuPlaceholder"))
        .addOptions(menuOptions.slice(0, 25))
        .setMinValues(1)
        .setMaxValues(1),
    );

    // Send the message with all components
    const response = await message.channel.send({
      embeds: [embed],
      components: [menuRow, buttonRow],
    });

    // Create collector for interactions
    const collector = response.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
      if (message.channel.type !== ChannelType.GuildText) return;

      try {
        if (interaction.isButton() && interaction.customId === "decode64_modal") {
          // Create modal for text input
          const modal = new ModalBuilder().setCustomId("decode64_modal_input").setTitle(t("decode64.title"));

          const textInput = new TextInputBuilder()
            .setCustomId("decode64_text")
            .setLabel(t("decode64.inputLabel"))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMinLength(4)
            .setMaxLength(2000);

          const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
          modal.addComponents(modalRow);

          await interaction.showModal(modal);
        } else if (interaction.isButton() && interaction.customId === "decode64_paste") {
          // Handle paste option
          await interaction.reply({
            content: t("decode64.replyPaste"),
            flags: "Ephemeral",
          });

          const filter = (m: any) => m.author.id === interaction.user.id;
          const collected = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 60000,
            errors: ["time"],
          });

          const content = collected.first()?.content;
          if (content) {
            await processDecode64(interaction, content);
          }
        } else if (interaction.isStringSelectMenu() && interaction.customId === "decode64_menu") {
          // Handle menu selection
          const messageId = interaction.values[0];
          const selectedMessage = recentMessages.get(messageId);
          if (selectedMessage) {
            await processDecode64(interaction, selectedMessage.content);
          }
        }
      } catch (error) {
        console.error("Error in decode64 interaction:", error);
        await interaction.reply({
          content: t("decode64.errorProcessing"),
          flags: "Ephemeral",
        });
      }
    });

    // Handle modal submissions
    client.on("interactionCreate", async (modalInteraction) => {
      if (!modalInteraction.isModalSubmit() || modalInteraction.customId !== "decode64_modal_input") return;

      try {
        const text = modalInteraction.fields.getTextInputValue("decode64_text");
        await processDecode64(modalInteraction, text);
      } catch (error) {
        console.error("Error in modal submission:", error);
        await modalInteraction.reply({
          content: t("decode64.errorProcessingInput"),
          flags: "Ephemeral",
        });
      }
    });

    async function processDecode64(interaction: any, input: string) {
      try {
        // Check if the input is valid Base64
        if (!/^[A-Za-z0-9+/=]+$/.test(input)) {
          await interaction.reply({
            content: t("decode64.invalidBase64"),
            flags: "Ephemeral",
          });
          return;
        }

        // Decode the Base64
        const decoded = Buffer.from(input, "base64").toString("utf-8");

        // Create result embed
        const resultEmbed = new EmbedCorrect()
          .setTitle(t("decode64.resultTitle"))
          .addFields(
            { name: t("decode64.originalField"), value: `\`\`\`${input.slice(0, 1000)}\`\`\``, inline: false },
            { name: t("decode64.decodedField"), value: `\`\`\`${decoded.slice(0, 1000)}\`\`\``, inline: false },
          )
          .setFooter({
            text: t("decode64.footer", { user: interaction.user.tag }),
            iconURL: interaction.user.displayAvatarURL(),
          });

        // Add delete button
        const deleteButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`delete_${interaction.user.id}`)
            .setLabel(t("decode64.deleteButton"))
            .setStyle(ButtonStyle.Danger),
        );

        // Reply with the result
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            embeds: [resultEmbed],
            components: [deleteButton],
            flags: "Ephemeral",
          });
        } else {
          await interaction.reply({
            embeds: [resultEmbed],
            components: [deleteButton],
            flags: "Ephemeral",
          });
        }

        // Handle delete button
        const collector = (await interaction.fetchReply()).createMessageComponentCollector({
          filter: (i: any) => i.customId === `delete_${interaction.user.id}` && i.user.id === interaction.user.id,
          time: 60000,
        });

        collector.on("collect", async (i: any) => {
          if (i.customId === `delete_${interaction.user.id}`) {
            await i.deferUpdate();
            await i.deleteReply();
          }
        });
      } catch (error) {
        console.error("Error decoding Base64:", error);
        await interaction.reply({
          content: t("decode64.errorDecoding"),
          flags: "Ephemeral",
        });
      }
    }
  },
};

export default decode64Command;
