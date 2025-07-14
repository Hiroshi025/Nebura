/* // src/commands/giveaway/create.ts
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType,
	ComponentType, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, User
} from "discord.js";

import { main } from "@/main"; // Ajusta la ruta según tu estructura
import { MyDiscord } from "@messaging/modules/discord/client";
import { GiveawayInterface, Precommand } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

//TODO: No crea el sorteo configurado y cambia los ephemerañ: true por los flags

const GiveawayCreate: Precommand = {
  name: "giveaway-create",
  description: "Create a new interactive giveaway with custom settings",
  examples: ["/giveaway create"],
  nsfw: false,
  owner: false,
  category: "Giveaways",
  aliases: ["giveaway-create", "giveawaycreate", "giveawaycreate"],
  cooldown: 5,
  permissions: ["Administrator"],
  botpermissions: ["SendMessages", "EmbedLinks", "AddReactions", "ManageMessages", "ViewChannel"],
  async execute(client, message) {
    if (!message.guild || !message.channel) {
      await message.reply({
        embeds: [new ErrorEmbed().setDescription("This command can only be used in a server channel.")],
        flags: "SuppressNotifications",
      });
      return;
    }

    // Initial setup embed
    const setupEmbed = new EmbedBuilder()
      .setTitle("🎉 Giveaway Creation Wizard")
      .setDescription(
        "Please configure your giveaway using the options below.\n\n**Required Steps:**\n1. Set Prize & Winners\n2. Set Duration\n3. Select Channel\n\n*Optional:*\n- Set Participation Requirements",
      )
      .setColor("#FFA500")
      .setFooter({ text: "Giveaway creation will timeout after 10 minutes of inactivity." });

    const setupButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("giveaway_setup_prize")
        .setLabel("Prize & Winners")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎁"),
      new ButtonBuilder()
        .setCustomId("giveaway_setup_duration")
        .setLabel("Duration")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⏱️"),
      new ButtonBuilder()
        .setCustomId("giveaway_setup_channel")
        .setLabel("Channel")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📢"),
      new ButtonBuilder()
        .setCustomId("giveaway_setup_requirements")
        .setLabel("Requirements")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⚙️"),
      new ButtonBuilder()
        .setCustomId("giveaway_create_confirm")
        .setLabel("Create Giveaway")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)
        .setEmoji("✅"),
    );

    const botMessage = await message.reply({
      embeds: [setupEmbed],
      components: [setupButtons],
      flags: "SuppressNotifications",
    });

    const giveawayData: GiveawayInterface.Data = {};

    // Helper function to update the setup embed
    const updateStatusEmbed = async () => {
      const statusEmbed = new EmbedBuilder()
        .setTitle("🎉 Giveaway Configuration Status")
        .setColor("#FFA500")
        .addFields(
          {
            name: "🎁 Prize",
            value: giveawayData.prize
              ? `✅ ${giveawayData.prize}\nWinners: ${giveawayData.winners || 1}`
              : "❌ Not set",
            inline: true,
          },
          {
            name: "⏱️ Duration",
            value: giveawayData.duration ? `✅ ${formatDuration(giveawayData.duration)}` : "❌ Not set",
            inline: true,
          },
          {
            name: "📢 Channel",
            value: giveawayData.channelId ? `✅ <#${giveawayData.channelId}>` : "❌ Not set",
            inline: true,
          },
          {
            name: "⚙️ Requirements",
            value: giveawayData.requirements ? "✅ Custom requirements set" : "❌ None set",
            inline: true,
          },
        )
        .setFooter({ text: "Complete all required steps to enable creation." });

      setupButtons.components[4].setDisabled(!(giveawayData.prize && giveawayData.duration && giveawayData.channelId));

      await botMessage.edit({
        embeds: [statusEmbed],
        components: [setupButtons],
      });
    };

    // Collect button interactions
    const collector = message.channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 600_000, // 10 minutes
      filter: (i) => i.user.id === message.author.id,
    });

    collector.on("collect", async (buttonInteraction) => {
      try {
        switch (buttonInteraction.customId) {
          case "giveaway_setup_prize":
            await handlePrizeSetup(buttonInteraction, giveawayData);
            break;
          case "giveaway_setup_duration":
            await handleDurationSetup(buttonInteraction, giveawayData);
            break;
          case "giveaway_setup_channel":
            await handleChannelSelect(buttonInteraction, giveawayData);
            break;
          case "giveaway_setup_requirements":
            await handleRequirementsSetup(buttonInteraction, giveawayData);
            break;
          case "giveaway_create_confirm":
            await handleGiveawayCreation(buttonInteraction, giveawayData, client);
            collector.stop();
            return;
        }
        await updateStatusEmbed();
      } catch (error) {
        console.error("Error in giveaway setup:", error);
        if (buttonInteraction.replied || buttonInteraction.deferred) {
          await buttonInteraction.followUp({
            embeds: [new ErrorEmbed().setDescription("An error occurred while processing your request.")],
          });
        } else {
          await buttonInteraction.reply({
            embeds: [new ErrorEmbed().setDescription("An error occurred while processing your request.")],
            flags: "Ephemeral",
          });
        }
      }
    });

    collector.on("end", async () => {
      setupButtons.components.forEach((component) => component.setDisabled(true));
      await botMessage.edit({
        // <-- Cambiado de message.edit a botMessage.edit
        components: [setupButtons],
      });
    });

    // Handle modal submissions
    client.on("interactionCreate", async (modalInteraction) => {
      if (!modalInteraction.isModalSubmit()) return;
      if (!modalInteraction.customId.startsWith("giveaway_")) return;
      if (modalInteraction.user.id !== message.author.id) return;

      try {
        switch (modalInteraction.customId) {
          case "giveaway_prize_modal":
            await processPrizeModal(modalInteraction, giveawayData);
            break;
          case "giveaway_duration_modal":
            await processDurationModal(modalInteraction, giveawayData);
            break;
          case "giveaway_requirements_modal":
            await processRequirementsModal(modalInteraction, giveawayData);
            break;
        }
        await updateStatusEmbed();
      } catch (error) {
        console.error("Error processing modal:", error);
        await modalInteraction.reply({
          embeds: [new ErrorEmbed().setDescription("Failed to process your input.")],
          flags: "Ephemeral",
        });
      }
    });
  },
};

// ========== Helper Functions ==========

async function handlePrizeSetup(interaction: any, _giveawayData: GiveawayInterface.Data) {
  const modal = new ModalBuilder().setCustomId("giveaway_prize_modal").setTitle("Giveaway Prize Configuration");

  const prizeInput = new TextInputBuilder()
    .setCustomId("prize_input")
    .setLabel("What will you be giving away?")
    .setPlaceholder("e.g., Discord Nitro, $50 Gift Card, Custom Role")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const winnersInput = new TextInputBuilder()
    .setCustomId("winners_input")
    .setLabel("Number of winners (1-20)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue("1")
    .setMinLength(1)
    .setMaxLength(2);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(prizeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(winnersInput),
  );

  await interaction.showModal(modal);
}

async function handleDurationSetup(interaction: any, _giveawayData: GiveawayInterface.Data) {
  const modal = new ModalBuilder().setCustomId("giveaway_duration_modal").setTitle("Giveaway Duration Configuration");

  const durationInput = new TextInputBuilder()
    .setCustomId("duration_input")
    .setLabel("How long should the giveaway run?")
    .setPlaceholder("Examples: 1d, 12h, 30m, 1d12h30m")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput));

  await interaction.showModal(modal);
}

async function handleChannelSelect(interaction: any, giveawayData: GiveawayInterface.Data) {
  const channelSelectRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId("giveaway_channel_select")
      .setPlaceholder("Select a text channel for the giveaway")
      .setChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1),
  );

  await interaction.reply({
    content: "Please select the channel where the giveaway should be posted:",
    components: [channelSelectRow],
    flags: "Ephemeral",
  });

  const channelCollector = interaction.channel.createMessageComponentCollector({
    componentType: ComponentType.ChannelSelect,
    time: 60_000,
    filter: (i: any) => i.user.id === interaction.user.id,
  });

  channelCollector.on("collect", async (channelInteraction: any) => {
    const selectedChannelId = channelInteraction.values[0];
    const channel = await interaction.guild?.channels.fetch(selectedChannelId);

    if (!channel?.isTextBased()) {
      await channelInteraction.reply({
        embeds: [new ErrorEmbed().setDescription("Please select a valid text channel.")],
        flags: "Ephemeral",
      });
      return;
    }

    // Check if bot has permissions in the channel
    const permissions = channel.permissionsFor(interaction.guild?.members.me!);
    if (!permissions?.has(["ViewChannel", "SendMessages", "EmbedLinks"])) {
      await channelInteraction.reply({
        embeds: [
          new ErrorEmbed().setDescription(
            `I don't have permission to send messages in ${channel}. ` +
              "Please ensure I have 'View Channel', 'Send Messages', and 'Embed Links' permissions.",
          ),
        ],
        flags: "Ephemeral",
      });
      return;
    }

    giveawayData.channelId = selectedChannelId;
    await channelInteraction.reply({
      embeds: [new EmbedCorrect().setDescription(`✅ Giveaway will be posted in ${channel}`)],
      flags: "Ephemeral",
    });
    channelCollector.stop();
  });
}

async function handleRequirementsSetup(interaction: any, _giveawayData: GiveawayInterface.Data) {
  const modal = new ModalBuilder()
    .setCustomId("giveaway_requirements_modal")
    .setTitle("Giveaway Requirements Configuration");

  const rolesInput = new TextInputBuilder()
    .setCustomId("roles_input")
    .setLabel("Required Role IDs (comma separated)")
    .setPlaceholder("e.g., 1234567890, 9876543210")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const accountAgeInput = new TextInputBuilder()
    .setCustomId("account_age_input")
    .setLabel("Minimum Account Age (days)")
    .setPlaceholder("e.g., 7 for accounts older than 1 week")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const messageCountInput = new TextInputBuilder()
    .setCustomId("message_count_input")
    .setLabel("Minimum Message Count in Server")
    .setPlaceholder("e.g., 10 for users with at least 10 messages")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(rolesInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(accountAgeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(messageCountInput),
  );

  await interaction.showModal(modal);
}

async function handleGiveawayCreation(interaction: any, giveawayData: GiveawayInterface.Data, _client: MyDiscord) {
  // Validate all required fields
  if (!giveawayData.prize || !giveawayData.duration || !giveawayData.channelId) {
    await interaction.reply({
      embeds: [new ErrorEmbed().setDescription("Please complete all required fields before creating the giveaway.")],
      flags: "Ephemeral",
    });
    return;
  }

  try {
    await _client.giveaways.waitUntilReady(); // Espera a que el manager esté listo
    const channel = await interaction.guild?.channels.fetch(giveawayData.channelId);
    if (!channel?.isTextBased()) {
      await interaction.reply({
        embeds: [new ErrorEmbed().setDescription("The selected channel is no longer available.")],
        flags: "Ephemeral",
      });
      return;
    }

    const giveawayOptions = {
      prize: giveawayData.prize,
      winnerCount: giveawayData.winners || 1,
      duration: giveawayData.duration,
      hostedBy: interaction.user as User, // Pass the User object instead of the ID
      messages: {
        giveaway:
          "🎉 **GIVEAWAY EVENT STARTED!** 🎉\n\nDon't miss your chance to win an exclusive prize! React with 🎉 below to participate.",
        giveawayEnded:
          "🎉 **GIVEAWAY ENDED** 🎉\n\nThank you to everyone who participated! Check below to see if you are one of the lucky winners.",
        inviteToParticipate: "React with 🎉 to join this giveaway and stand a chance to win the prize!",
        timeRemaining: "⏳ **Time left:** {duration}",
        winMessage:
          "🎊 Congratulations {winners}! You have won **{prize}**! Please contact the staff to claim your reward.",
        noWinner: "The giveaway has ended with no valid entries. Better luck next time!",
        hostedBy: `👤 **Hosted by:** ${interaction.user as User}`,
        winners: "Winner(s)",
        endedAt: "🕒 **Ended at:**",
      },
      requirements: giveawayData.requirements
        ? {
            requiredRoles: giveawayData.requirements.roles ?? [],
            minAccountAge: giveawayData.requirements.accountAge ?? 0,
            minMessages: giveawayData.requirements.messageCount ?? 0,
          }
        : undefined,
    };

    // Start the giveaway
    const giveaway = await _client.giveaways.startGiveaway(channel, giveawayOptions);

    // Prepare database data
    const dbData = {
      messageId: giveaway.messageId,
      channelId: giveaway.channelId,
      guildId: giveaway.guildId,
      prize: giveaway.prize,
      winnerCount: giveaway.winnerCount,
      endsAt: new Date(giveaway.endAt),
      hostedBy: interaction.user.id,
      ...(giveawayData.requirements && {
        requirements: {
          create: {
            ...(giveawayData.requirements.roles && {
              requiredRoles: giveawayData.requirements.roles,
            }),
            ...(giveawayData.requirements.accountAge && {
              minAccountAge: giveawayData.requirements.accountAge,
            }),
            ...(giveawayData.requirements.messageCount && {
              minMessages: giveawayData.requirements.messageCount,
            }),
          },
        },
      }),
    };

    // Save to database
    await main.prisma.giveaway.create({ data: dbData });

    await interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle("🎉 Giveaway Successfully Created!")
          .setDescription(
            `**Prize:** ${giveawayData.prize}\n` +
              `**Winners:** ${giveawayData.winners || 1}\n` +
              `**Duration:** ${formatDuration(giveawayData.duration)}\n` +
              `**Channel:** ${channel}\n\n` +
              `[Jump to Giveaway](${giveaway.messageURL})`,
          ),
      ],
      flags: "Ephemeral",
    });
  } catch (error) {
    console.error("Giveaway creation error:", error);
    await interaction.reply({
      embeds: [new ErrorEmbed().setDescription("An error occurred while creating the giveaway. Please try again.")],
      flags: "Ephemeral",
    });
  }
}

async function processPrizeModal(interaction: any, giveawayData: GiveawayInterface.Data) {
  const prize = interaction.fields.getTextInputValue("prize_input").trim();
  const winnersInput = interaction.fields.getTextInputValue("winners_input").trim();
  const winners = Math.min(Math.max(parseInt(winnersInput) || 1, 1), 20);

  if (!prize) {
    await interaction.reply({
      embeds: [new ErrorEmbed().setDescription("Please provide a valid prize description.")],
      flags: "Ephemeral",
    });
    return;
  }

  giveawayData.prize = prize;
  giveawayData.winners = winners;

  await interaction.reply({
    embeds: [new EmbedCorrect().setDescription(`**Prize set:** ${prize}\n` + `**Winners:** ${winners}`)],
    flags: "Ephemeral",
  });
}

async function processDurationModal(interaction: any, giveawayData: GiveawayInterface.Data) {
  const durationInput = interaction.fields.getTextInputValue("duration_input").trim();
  const duration = parseDuration(durationInput);

  if (!duration) {
    await interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          "Invalid duration format. Please use formats like:\n" +
            "- `1d` (1 day)\n" +
            "- `12h` (12 hours)\n" +
            "- `30m` (30 minutes)\n" +
            "- `1d12h30m` (1 day, 12 hours, 30 minutes)",
        ),
      ],
      flags: "Ephemeral",
    });
    return;
  }

  // Minimum duration of 5 minutes
  const minDuration = 5 * 60 * 1000;
  if (duration < minDuration) {
    await interaction.reply({
      embeds: [new ErrorEmbed().setDescription("Giveaway duration must be at least 5 minutes.")],
      flags: "Ephemeral",
    });
    return;
  }

  // Maximum duration of 30 days
  const maxDuration = 30 * 24 * 60 * 60 * 1000;
  if (duration > maxDuration) {
    await interaction.reply({
      embeds: [new ErrorEmbed().setDescription("Giveaway duration cannot exceed 30 days.")],
      flags: "Ephemeral",
    });
    return;
  }

  giveawayData.duration = duration;

  await interaction.reply({
    embeds: [new EmbedCorrect().setDescription(`**Duration set:** ${formatDuration(duration)}`)],
    flags: "Ephemeral",
  });
}

async function processRequirementsModal(interaction: any, giveawayData: GiveawayInterface.Data) {
  const rolesInput = interaction.fields.getTextInputValue("roles_input").trim();
  const accountAgeInput = interaction.fields.getTextInputValue("account_age_input").trim();
  const messageCountInput = interaction.fields.getTextInputValue("message_count_input").trim();

  const requirements: any = {};

  if (rolesInput) {
    requirements.roles = rolesInput
      .split(",")
      .map((id: string) => id.trim())
      .filter(Boolean);
  }

  if (accountAgeInput) {
    requirements.accountAge = parseInt(accountAgeInput) || undefined;
  }

  if (messageCountInput) {
    requirements.messageCount = parseInt(messageCountInput) || undefined;
  }

  if (Object.keys(requirements).length > 0) {
    giveawayData.requirements = requirements;
    await interaction.reply({
      embeds: [
        new EmbedCorrect().setDescription(
          "**Requirements set:**\n" +
            (requirements.roles ? `- Roles: ${requirements.roles.length}\n` : "") +
            (requirements.accountAge ? `- Min Account Age: ${requirements.accountAge} days\n` : "") +
            (requirements.messageCount ? `- Min Messages: ${requirements.messageCount}` : ""),
        ),
      ],
      flags: "Ephemeral",
    });
  } else {
    delete giveawayData.requirements;
    await interaction.reply({
      embeds: [new EmbedCorrect().setDescription("No requirements set - giveaway will be open to everyone.")],
      flags: "Ephemeral",
    });
  }
}

function parseDuration(durationStr: string): number | null {
  const regex = /(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?/i;
  const matches = durationStr.match(regex);

  if (!matches) return null;

  const days = parseInt(matches[1]) || 0;
  const hours = parseInt(matches[2]) || 0;
  const minutes = parseInt(matches[3]) || 0;

  if (days + hours + minutes === 0) return null;

  return days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000 + minutes * 60 * 1000;
}

function formatDuration(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

  return parts.join(", ") || "0 minutes";
}

export default GiveawayCreate;
 */
