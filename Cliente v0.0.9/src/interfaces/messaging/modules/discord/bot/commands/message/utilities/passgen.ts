import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect } from "@utils/extenders/embeds.extend";

const passwordCommand: Precommand = {
  name: "passgen",
  description: "Generate secure passwords interactively",
  examples: ["password"],
  nsfw: false,
  owner: false,
  cooldown: 20,
  aliases: ["genpass", "generatepassword", "securepass"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Main embed
    const embed = new EmbedCorrect()
      .setTitle("🔐 Password Generator")
      .setDescription("Choose how you want to generate your password:")
      .addFields({
        name: "Options",
        value:
          "⚡ **Quick Generate**: Random 12-character password\n⚙️ **Custom**: Configure length and character types\n🔢 **PIN**: Generate numeric PIN code",
      })
      .setFooter({ text: "All passwords are generated locally and never stored" });

    // Action buttons
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("pass_quick")
        .setLabel("Quick Generate")
        .setStyle(ButtonStyle.Success)
        .setEmoji("⚡"),
      new ButtonBuilder()
        .setCustomId("pass_custom")
        .setLabel("Custom Settings")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⚙️"),
      new ButtonBuilder()
        .setCustomId("pass_pin")
        .setLabel("Generate PIN")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔢"),
    );

    // Length selector menu
    const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("pass_length")
        .setPlaceholder("Select password length (Default: 12)")
        .addOptions(
          { label: "Short (8 chars)", value: "8", description: "For temporary uses", emoji: "🟢" },
          { label: "Standard (12 chars)", value: "12", description: "Recommended default", emoji: "🔵" },
          { label: "Strong (16 chars)", value: "16", description: "For important accounts", emoji: "🟣" },
          { label: "Very Strong (24 chars)", value: "24", description: "Maximum security", emoji: "🟠" },
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
          content: "❌ An error occurred while generating your password.",
          flags: "Ephemeral",
        });
      }
    });

    // Modal for custom password generation
    async function showCustomModal(interaction: any) {
      const modal = new ModalBuilder().setCustomId("pass_custom_modal").setTitle("Custom Password Settings");

      // Length input
      const lengthInput = new TextInputBuilder()
        .setCustomId("pass_length_input")
        .setLabel("Password Length (8-64)")
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(2)
        .setPlaceholder("12")
        .setRequired(true);

      // Character types
      const typesInput = new TextInputBuilder()
        .setCustomId("pass_types_input")
        .setLabel("Character Types (1-4)")
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(10)
        .setValue("1234")
        .setRequired(true)
        .setPlaceholder("1: Uppercase, 2: Lowercase, 3: Numbers, 4: Symbols");

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
            content: "❌ Please enter a valid length between 8 and 64.",
            flags: "Ephemeral",
          });
          return;
        }

        const password = generateCustomPassword(length, types);
        await sendPasswordResult(modalInteraction, password, "Custom Password");
      } catch (error) {
        console.error("Custom password error:", error);
        await modalInteraction.reply({
          content: "❌ Invalid input format. Please try again.",
          flags: "Ephemeral",
        });
      }
    });

    // Generate quick password
    async function handleQuickGenerate(interaction: any, length = 12) {
      const password = generatePassword(length);
      await sendPasswordResult(interaction, password, "Generated Password");
    }

    // Generate numeric PIN
    async function generatePIN(interaction: any) {
      const pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
      await sendPasswordResult(interaction, pin, "Generated PIN", true);
    }

    // Send the result to user
    async function sendPasswordResult(interaction: any, password: string, title: string, isPIN = false) {
      const resultEmbed = new EmbedCorrect()
        .setTitle(`✅ ${title}`)
        .setDescription(`Here's your secure ${isPIN ? "PIN" : "password"}:`)
        .addFields({ name: isPIN ? "PIN Code" : "Password", value: `\`\`\`${password}\`\`\`` })
        .setFooter({ text: "This is only shown to you | Generated at" })
        .setTimestamp();

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`copy_${interaction.user.id}`)
          .setLabel("Copy to Clipboard")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("📋"),
        new ButtonBuilder()
          .setCustomId(`regenerate_${interaction.user.id}`)
          .setLabel("Generate Another")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId(`delete_${interaction.user.id}`)
          .setLabel("Delete")
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
            content: "✅ Password copied to your clipboard!",
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

export = passwordCommand;
