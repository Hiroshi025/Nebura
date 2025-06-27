import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder,
	StringSelectMenuBuilder, TextInputBuilder, TextInputStyle
} from "discord.js";

import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect } from "@utils/extends/embeds.extension";

const decode64Command: Precommand = {
  name: "decode64",
  description: "Decode Base64 text interactively",
  examples: ["decode64"],
  nsfw: false,
  owner: false,
  cooldown: 30,
  aliases: ["dec64", "base64decode"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Create initial embed
    const embed = new EmbedCorrect()
      .setTitle("Base64 Decoder")
      .setDescription("Choose how you want to provide the Base64 text to decode:")
      .addFields({
        name: "Options",
        value:
          "🔘 **Button**: Open a modal to input text\n📝 **Menu**: Select from recent messages\n📋 **Paste**: Decode directly from this message",
      });

    // Create action row with buttons
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("decode64_modal")
        .setLabel("Use Modal")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔘"),
      new ButtonBuilder()
        .setCustomId("decode64_paste")
        .setLabel("Paste Here")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📋"),
    );

    // Create select menu with recent messages
    const recentMessages = await message.channel.messages.fetch({ limit: 10 });
    const menuOptions = recentMessages.map((msg) => ({
      label: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""),
      value: msg.id,
      description: `Message from ${msg.author.username}`,
      emoji: "💬",
    }));

    const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("decode64_menu")
        .setPlaceholder("Select a message to decode")
        .addOptions(menuOptions.slice(0, 25)) // Discord allows max 25 options
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
          const modal = new ModalBuilder().setCustomId("decode64_modal_input").setTitle("Base64 Decoder");

          const textInput = new TextInputBuilder()
            .setCustomId("decode64_text")
            .setLabel("Enter Base64 text to decode")
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
            content: "Please reply to this message with the Base64 text you want to decode.",
            ephemeral: true,
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
          content: "An error occurred while processing your request.",
          ephemeral: true,
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
          content: "An error occurred while processing your input.",
          ephemeral: true,
        });
      }
    });

    async function processDecode64(interaction: any, input: string) {
      try {
        // Check if the input is valid Base64
        if (!/^[A-Za-z0-9+/=]+$/.test(input)) {
          await interaction.reply({
            content: "The provided text doesn't appear to be valid Base64.",
            ephemeral: true,
          });
          return;
        }

        // Decode the Base64
        const decoded = Buffer.from(input, "base64").toString("utf-8");

        // Create result embed
        const resultEmbed = new EmbedCorrect()
          .setTitle("Base64 Decoding Result")
          .addFields(
            { name: "Original", value: `\`\`\`${input.slice(0, 1000)}\`\`\``, inline: false },
            { name: "Decoded", value: `\`\`\`${decoded.slice(0, 1000)}\`\`\``, inline: false },
          )
          .setFooter({
            text: `Decoded for ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          });

        // Add delete button
        const deleteButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`delete_${interaction.user.id}`)
            .setLabel("Delete")
            .setStyle(ButtonStyle.Danger),
        );

        // Reply with the result
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            embeds: [resultEmbed],
            components: [deleteButton],
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            embeds: [resultEmbed],
            components: [deleteButton],
            ephemeral: true,
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
          content: "An error occurred while decoding the Base64 text. Please make sure it's valid Base64.",
          ephemeral: true,
        });
      }
    }
  },
};

export = decode64Command;
