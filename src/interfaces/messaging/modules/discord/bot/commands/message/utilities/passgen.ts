import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder,
	StringSelectMenuBuilder, TextInputBuilder, TextInputStyle
} from "discord.js";

import { EmbedCorrect } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const passwordCommand: Precommand = {
  name: "passgen",
  description: "Generate secure passwords interactively",
  examples: ["password"],
  nsfw: false,
  owner: false,

  cooldown: 20,
  category: "Utilities",
  aliases: ["genpass", "generatepassword", "securepass"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Main embed
    const embed = new EmbedCorrect()
      .setTitle(client.t("discord:passgen.title", { lng: message.guild.preferredLocale }))
      .setDescription(client.t("discord:passgen.desc", { lng: message.guild.preferredLocale }))
      .addFields({
        name: client.t("discord:passgen.optionsTitle", { lng: message.guild.preferredLocale }),
        value: client.t("discord:passgen.optionsValue", { lng: message.guild.preferredLocale }),
      })
      .setFooter({ text: client.t("discord:passgen.footer", { lng: message.guild.preferredLocale }) });

    // Action buttons
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("pass_quick")
        .setLabel(client.t("discord:passgen.quickButton", { lng: message.guild.preferredLocale }))
        .setStyle(ButtonStyle.Success)
        .setEmoji("⚡"),
      new ButtonBuilder()
        .setCustomId("pass_custom")
        .setLabel(client.t("discord:passgen.customButton", { lng: message.guild.preferredLocale }))
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⚙️"),
      new ButtonBuilder()
        .setCustomId("pass_pin")
        .setLabel(client.t("discord:passgen.pinButton", { lng: message.guild.preferredLocale }))
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔢"),
    );

    // Length selector menu
    const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("pass_length")
        .setPlaceholder(client.t("discord:passgen.lengthPlaceholder", { lng: message.guild.preferredLocale }))
        .addOptions(
          {
            label: client.t("discord:passgen.shortLabel", { lng: message.guild.preferredLocale }),
            value: "8",
            description: client.t("discord:passgen.shortDesc", { lng: message.guild.preferredLocale }),
            emoji: "🟢",
          },
          {
            label: client.t("discord:passgen.standardLabel", { lng: message.guild.preferredLocale }),
            value: "12",
            description: client.t("discord:passgen.standardDesc", { lng: message.guild.preferredLocale }),
            emoji: "🔵",
          },
          {
            label: client.t("discord:passgen.strongLabel", { lng: message.guild.preferredLocale }),
            value: "16",
            description: client.t("discord:passgen.strongDesc", { lng: message.guild.preferredLocale }),
            emoji: "🟣",
          },
          {
            label: client.t("discord:passgen.veryStrongLabel", { lng: message.guild.preferredLocale }),
            value: "24",
            description: client.t("discord:passgen.veryStrongDesc", { lng: message.guild.preferredLocale }),
            emoji: "🟠",
          },
        ),
    );

    const response = await message.channel.send({
      embeds: [embed],
      components: [buttonRow, menuRow],
    });

    // Collector for interactions
    const collector = response.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (interaction) => {
      try {
        if (interaction.isButton()) {
          if (interaction.customId === "pass_quick") {
            await handleQuickGenerate(interaction);
          } else if (interaction.customId === "pass_custom") {
            await showCustomModal(interaction);
          } else if (interaction.customId === "pass_pin") {
            await generatePIN(interaction);
          }
        } else if (interaction.isStringSelectMenu() && interaction.customId === "pass_length") {
          const length = parseInt(interaction.values[0]);
          await handleQuickGenerate(interaction, length);
        }
      } catch (error) {
        console.error("Password generator error:", error);
        await interaction.reply({
          content: client.t("discord:passgen.error", { lng: interaction.guild?.preferredLocale }),
          flags: "Ephemeral",
        });
      }
    });

    // Modal for custom password generation
    async function showCustomModal(interaction: any) {
      const modal = new ModalBuilder()
        .setCustomId("pass_custom_modal")
        .setTitle(client.t("discord:passgen.customModalTitle", { lng: interaction.guild?.preferredLocale }));

      // Length input
      const lengthInput = new TextInputBuilder()
        .setCustomId("pass_length_input")
        .setLabel(client.t("discord:passgen.lengthInputLabel", { lng: interaction.guild?.preferredLocale }))
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(2)
        .setPlaceholder("12")
        .setRequired(true);

      // Character types
      const typesInput = new TextInputBuilder()
        .setCustomId("pass_types_input")
        .setLabel(client.t("discord:passgen.typesInputLabel", { lng: interaction.guild?.preferredLocale }))
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(10)
        .setValue("1234")
        .setRequired(true)
        .setPlaceholder(client.t("discord:passgen.typesInputPlaceholder", { lng: interaction.guild?.preferredLocale }));

      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(lengthInput);
      const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(typesInput);

      modal.addComponents(row1, row2);
      await interaction.showModal(modal);
    }

    // Handle modal submission
    client.on("interactionCreate", async (modalInteraction) => {
      if (!modalInteraction.isModalSubmit() || modalInteraction.customId !== "pass_custom_modal") return;

      try {
        const length = parseInt(modalInteraction.fields.getTextInputValue("pass_length_input"));
        const types = modalInteraction.fields.getTextInputValue("pass_types_input");

        if (isNaN(length) || length < 8 || length > 64) {
          await modalInteraction.reply({
            content: client.t("discord:passgen.invalidLength", { lng: modalInteraction.guild?.preferredLocale }),
            flags: "Ephemeral",
          });
          return;
        }

        const password = generateCustomPassword(length, types);
        await sendPasswordResult(modalInteraction, password, "Custom Password");
      } catch (error) {
        console.error("Custom password error:", error);
        await modalInteraction.reply({
          content: client.t("discord:passgen.invalidInput", { lng: modalInteraction.guild?.preferredLocale }),
          flags: "Ephemeral",
        });
      }
    });

    // Generate quick password
    async function handleQuickGenerate(interaction: any, length = 12) {
      const password = generatePassword(length);
      await sendPasswordResult(
        interaction,
        password,
        client.t("discord:passgen.generatedPassword", { lng: interaction.guild?.preferredLocale }),
      );
    }

    // Generate numeric PIN
    async function generatePIN(interaction: any) {
      const pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
      await sendPasswordResult(
        interaction,
        pin,
        client.t("discord:passgen.generatedPIN", { lng: interaction.guild?.preferredLocale }),
        true,
      );
    }

    // Send the result to user
    async function sendPasswordResult(interaction: any, password: string, title: string, isPIN = false) {
      const resultEmbed = new EmbedCorrect()
        .setTitle(`✅ ${title}`)
        .setDescription(client.t("discord:passgen.resultDesc", { isPIN, lng: interaction.guild?.preferredLocale }))
        .addFields({
          name: isPIN
            ? client.t("discord:passgen.pinField", { lng: interaction.guild?.preferredLocale })
            : client.t("discord:passgen.passwordField", { lng: interaction.guild?.preferredLocale }),
          value: `\`\`\`${password}\`\`\``,
        })
        .setFooter({ text: client.t("discord:passgen.resultFooter", { lng: interaction.guild?.preferredLocale }) })
        .setTimestamp();

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`copy_${interaction.user.id}`)
          .setLabel(client.t("discord:passgen.copyButton", { lng: interaction.guild?.preferredLocale }))
          .setStyle(ButtonStyle.Primary)
          .setEmoji("📋"),
        new ButtonBuilder()
          .setCustomId(`regenerate_${interaction.user.id}`)
          .setLabel(client.t("discord:passgen.regenerateButton", { lng: interaction.guild?.preferredLocale }))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId(`delete_${interaction.user.id}`)
          .setLabel(client.t("discord:passgen.deleteButton", { lng: interaction.guild?.preferredLocale }))
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️"),
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          embeds: [resultEmbed],
          components: [actionRow],
          flags: "Ephemeral",
        });
      } else {
        await interaction.reply({
          embeds: [resultEmbed],
          components: [actionRow],
          flags: "Ephemeral",
        });
      }

      // Handle button interactions
      const collector = (await interaction.fetchReply()).createMessageComponentCollector({
        filter: (i: any) => i.user.id === interaction.user.id,
        time: 60000,
      });

      collector.on("collect", async (i: any) => {
        if (i.customId === `copy_${interaction.user.id}`) {
          await i.reply({
            content: client.t("discord:passgen.copied", { lng: i.guild?.preferredLocale }),
            flags: "Ephemeral",
          });
        } else if (i.customId === `regenerate_${interaction.user.id}`) {
          await i.deferUpdate();
          if (title.includes("PIN")) {
            await generatePIN(i);
          } else if (title.includes("Custom")) {
            await showCustomModal(i);
          } else {
            await handleQuickGenerate(i);
          }
        } else if (i.customId === `delete_${interaction.user.id}`) {
          await i.deferUpdate();
          await i.deleteReply();
        }
      });
    }

    // Password generation functions
    function generatePassword(length = 12): string {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
      let password = "";
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    }

    function generateCustomPassword(length: number, types: string): string {
      let chars = "";
      const charSets = {
        "1": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "2": "abcdefghijklmnopqrstuvwxyz",
        "3": "0123456789",
        "4": "!@#$%^&*()_+-=[]{}|;:,.<>?",
      };

      for (const type of types) {
        if (charSets[type as keyof typeof charSets]) {
          chars += charSets[type as keyof typeof charSets];
        }
      }

      if (!chars) chars = charSets["1"] + charSets["2"] + charSets["3"] + charSets["4"];

      let password = "";
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    }
  },
};

export default passwordCommand;
