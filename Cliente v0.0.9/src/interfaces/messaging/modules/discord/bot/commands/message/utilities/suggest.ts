import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, Message, ModalBuilder,
	TextInputBuilder, TextInputStyle
} from "discord.js";

import { main } from "@/main";
import { clientID } from "@/shared/class/DB";
import { MyDiscord } from "@messaging/modules/discord/client";
import { Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const suggestCommand: Precommand = {
  name: "suggest",
  description: "Submit a suggestion to the server",
  examples: ["suggest", 'suggest "Improve the bot" "Add more features"'],
  nsfw: false,
  owner: false,
  cooldown: 30,
  category: "Utilities",
  maintenance: true,
  aliases: ["suggestion", "proposal"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Check if suggestion channel is set up
    const myGuild = await main.prisma.myGuild.findUnique({
      where: { guildId: message.guild.id },
    });

    const data = await main.DB.findClient(clientID);
    if (!data || data.maintenance) {
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Maintenance Mode")
            .setDescription("The bot is currently under maintenance. Please try again later."),
        ],
      });
    }

    if (!myGuild?.suggestChannel) {
      return message.reply({
        embeds: [
          new ErrorEmbed().setTitle("Error").setDescription("This server doesn't have a suggestions channel set up."),
        ],
      });
    }

    // If arguments are provided, use them as the suggestion
    if (args.length > 0) {
      const suggestionText = args.join(" ");
      return sendSuggestion(client, message, suggestionText);
    }

    // Create interactive buttons
    const createButton = new ButtonBuilder()
      .setCustomId("suggest_create")
      .setLabel("Create Suggestion")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("📝");

    const helpButton = new ButtonBuilder()
      .setCustomId("suggest_help")
      .setLabel("How to Suggest")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("❓");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(createButton, helpButton);

    const embed = new EmbedCorrect()
      .setTitle("Suggestion System")
      .setDescription("Would you like to create a new suggestion?")
      .addFields({
        name: "Guidelines",
        value: "• Be clear and concise\n• Provide details if needed\n• Check for duplicates first",
        inline: false,
      });

    const reply = await message.reply({
      embeds: [embed],
      components: [row],
    });

    // Create collector for button interactions
    const collector = reply.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;

      switch (interaction.customId) {
        case "suggest_create":
          // Create modal for suggestion input
          const modal = new ModalBuilder().setCustomId("suggest_modal").setTitle("Create Suggestion");

          const suggestionInput = new TextInputBuilder()
            .setCustomId("suggest_text")
            .setLabel("Your suggestion")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(2000)
            .setPlaceholder("Describe your suggestion in detail...");

          const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(suggestionInput);
          modal.addComponents(firstActionRow);

          await interaction.showModal(modal);

          // Handle modal submission
          try {
            const modalInteraction = await interaction.awaitModalSubmit({
              time: 300000,
              filter: (i) => i.user.id === interaction.user.id,
            });

            const suggestionText = modalInteraction.fields.getTextInputValue("suggest_text");
            await sendSuggestion(client, message, suggestionText);

            await modalInteraction.reply({
              content: "Your suggestion has been submitted!",
              flags: "Ephemeral",
            });
          } catch (error) {
            console.error("Modal error:", error);
          }
          break;

        case "suggest_help":
          const helpEmbed = new EmbedBuilder()
            .setTitle("Suggestion Help")
            .setDescription("Here's how to make effective suggestions:")
            .addFields(
              {
                name: "1. Be Specific",
                value: "Clearly describe what you're suggesting.",
                inline: false,
              },
              {
                name: "2. Explain Benefits",
                value: "How will this improve the server/bot?",
                inline: false,
              },
              {
                name: "3. Provide Examples",
                value: "If possible, show examples of what you mean.",
                inline: false,
              },
              {
                name: "4. Check for Duplicates",
                value: "Make sure your suggestion hasn't been made before.",
                inline: false,
              },
            )
            .setFooter({ text: "You can also type your suggestion after the command, like: !suggest [your idea]" });

          await interaction.reply({
            embeds: [helpEmbed],
            flags: "Ephemeral",
          });
          break;
      }
    });

    collector.on("end", () => {
      reply
        .edit({
          components: [],
        })
        .catch(() => {});
    });
  },
} as Precommand;

// Helper method to send the suggestion to the designated channel
async function sendSuggestion(_client: MyDiscord, message: Message<boolean>, suggestionText: string) {
  const myGuild = await main.prisma.myGuild.findUnique({
    where: { guildId: message.guild?.id },
  });

  if (!myGuild?.suggestChannel) return;

  const suggestChannel = message.guild?.channels.cache.get(myGuild.suggestChannel);
  if (!suggestChannel || suggestChannel.type !== ChannelType.GuildText) return;

  // Create the suggestion in the designated channel
  await suggestChannel.send({
    content: suggestionText,
    files: message.attachments.map((a) => a.url),
  });

  // Delete the original command message if possible
  if (message.deletable) {
    await message.delete().catch(() => {});
  }
}

export = suggestCommand;
