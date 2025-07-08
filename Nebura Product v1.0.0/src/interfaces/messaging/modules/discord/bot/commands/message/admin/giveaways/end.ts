import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message,
	MessageActionRowComponentBuilder, StringSelectMenuBuilder
} from "discord.js";

import { GiveawayManager } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@/shared/adapters/extends/embeds.extend";
import { Precommand } from "@typings/modules/discord";

const GiveawayEnd: Precommand = {
  name: "giveaway-end",
  description: "End a giveaway early and select winners",
  examples: ["giveaway end", "giveaway end <messageId>"],
  nsfw: false,
  owner: false,
  permissions: ["Administrator"],
  botpermissions: ["SendMessages", "EmbedLinks", "ManageMessages"],
  async execute(_client, message, args) {
    if (!message.guild) {
      return message.reply({
        embeds: [new ErrorEmbed().setDescription("This command can only be used in a server.")],
        allowedMentions: { repliedUser: false },
      });
    }

    try {
      // Check if a specific giveaway was mentioned
      const targetGiveawayId = args[0];
      if (targetGiveawayId) {
        return endSpecificGiveaway(message, targetGiveawayId);
      }

      const activeGiveaways = await GiveawayManager.getManager()
        .giveaways.filter((g) => g.guildId === message.guild?.id && !g.ended)
        .sort((a, b) => a.endAt - b.endAt); // Sort by soonest to end

      if (activeGiveaways.length === 0) {
        return message.reply({
          embeds: [new ErrorEmbed().setDescription("There are no active giveaways to end in this server.")],
          allowedMentions: { repliedUser: false },
        });
      }

      // If only one active giveaway, skip selection
      if (activeGiveaways.length === 1) {
        return confirmGiveawayEnd(message, activeGiveaways[0]);
      }

      // Create selection menu for multiple giveaways
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`giveaway_end_select_${message.id}`)
        .setPlaceholder("Select a giveaway to end")
        .addOptions(
          activeGiveaways.slice(0, 25).map((g) => ({
            label: g.prize.length > 100 ? `${g.prize.substring(0, 97)}...` : g.prize,
            description: `Ends in ${formatDuration(g.remainingTime)} | ${g.winnerCount} winner(s)`,
            value: g.messageId,
            emoji: "⏱️",
          })),
        );

      const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(selectMenu);

      const embed = new ErrorEmbed()
        .setTitle("🎉 End a Giveaway Early")
        .setDescription("Select the giveaway you want to end from the menu below.")
        .setFooter({ text: `Found ${activeGiveaways.length} active giveaways` });

      const response = await message.reply({
        embeds: [embed],
        components: [actionRow],
        allowedMentions: { repliedUser: false },
      });

      // Handle selection
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60_000,
        filter: (i) => i.user.id === message.author.id,
      });

      collector.on("collect", async (selectInteraction) => {
        const selectedId = selectInteraction.values[0];
        const selectedGiveaway = activeGiveaways.find((g) => g.messageId === selectedId);

        if (!selectedGiveaway) {
          await selectInteraction.reply({
            embeds: [new ErrorEmbed().setDescription("The selected giveaway could not be found.")],
            ephemeral: true,
          });
          return;
        }

        collector.stop();
        await confirmGiveawayEnd(selectInteraction, selectedGiveaway);
      });

      collector.on("end", () => {
        response.edit({ components: [] }).catch(console.error);
      });
    } catch (error) {
      console.error("Error in giveaway end command:", error);
      await message.reply({
        embeds: [new ErrorEmbed().setDescription("An error occurred while processing the command.")],
        allowedMentions: { repliedUser: false },
      });
    }
  },
};

/**
 * Ends a specific giveaway by message ID
 */
async function endSpecificGiveaway(message: Message, giveawayId: string) {
  try {
    const giveaway = await GiveawayManager.getManager().giveaways.find(
      (g) => g.messageId === giveawayId && g.guildId === message.guild?.id,
    );

    if (!giveaway) {
      return message.reply({
        embeds: [new ErrorEmbed().setDescription(`No active giveaway found with ID \`${giveawayId}\` in this server.`)],
        allowedMentions: { repliedUser: false },
      });
    }

    if (giveaway.ended) {
      return message.reply({
        embeds: [new ErrorEmbed().setDescription(`The giveaway for **${giveaway.prize}** has already ended.`)],
        allowedMentions: { repliedUser: false },
      });
    }

    return confirmGiveawayEnd(message, giveaway);
  } catch (error) {
    console.error("Error ending specific giveaway:", error);
    await message.reply({
      embeds: [new ErrorEmbed().setDescription("Failed to process the specified giveaway.")],
      allowedMentions: { repliedUser: false },
    });
  }
}

/**
 * Confirms and executes the ending of a giveaway
 */
async function confirmGiveawayEnd(interaction: Message | any, giveaway: any) {
  try {
    const isMessage = interaction instanceof Message;
    const userId = isMessage ? interaction.author.id : interaction.user.id;

    const embed = new ErrorEmbed()
      .setTitle("⚠️ Confirm Giveaway End")
      .setDescription(
        `You are about to end the giveaway for **${giveaway.prize}**\n\n` +
          `- **Winners:** ${giveaway.winnerCount}\n` +
          `- **Participants:** ${giveaway.entrantIds?.length || 0}\n` +
          `- **Time remaining:** ${formatDuration(giveaway.remainingTime)}\n\n` +
          "This action cannot be undone. Are you sure you want to proceed?",
      )
      .setFooter({ text: `Giveaway ID: ${giveaway.messageId}` });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_end_confirm_${giveaway.messageId}`)
        .setLabel("End Giveaway")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⏹️"),
      new ButtonBuilder()
        .setCustomId(`giveaway_end_cancel_${giveaway.messageId}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("✖️"),
    );

    const response = isMessage
      ? await interaction.reply({
          embeds: [embed],
          components: [buttons],
          allowedMentions: { repliedUser: false },
        })
      : await interaction.update({
          embeds: [embed],
          components: [buttons],
        });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
      filter: (i: { user: { id: any } }) => i.user.id === userId,
    });

    collector.on(
      "collect",
      async (buttonInteraction: import("discord.js").ButtonInteraction<import("discord.js").CacheType>) => {
        try {
          if (buttonInteraction.customId === `giveaway_end_confirm_${giveaway.messageId}`) {
            await buttonInteraction.deferReply();

            // End the giveaway
            await GiveawayManager.getManager().end(giveaway.messageId);

            await buttonInteraction.followUp({
              embeds: [
                new EmbedCorrect().setDescription(
                  `Successfully ended the giveaway for **${giveaway.prize}**!\n` +
                    `[View Giveaway](${giveaway.messageURL})`,
                ),
              ],
              ephemeral: true,
            });

            // Update the original message
            await response.edit({
              embeds: [
                embed
                  .setTitle("✅ Giveaway Ended")
                  .setColor("#00FF00")
                  .setDescription(
                    `The giveaway for **${giveaway.prize}** has been ended early.\n\n` +
                      `[View Giveaway](${giveaway.messageURL})`,
                  ),
              ],
              components: [],
            });
          } else {
            await buttonInteraction.update({
              embeds: [new EmbedCorrect().setDescription("Giveaway ending cancelled.")],
              components: [],
            });
          }
        } catch (error) {
          console.error("Error ending giveaway:", error);
          // Use type assertion to access replied/deferred safely
          if ((buttonInteraction as any).replied || (buttonInteraction as any).deferred) {
            await buttonInteraction.followUp({
              embeds: [
                new ErrorEmbed().setDescription("Failed to end the giveaway. Please try again or check permissions."),
              ],
              ephemeral: true,
            });
          } else {
            await buttonInteraction.reply({
              embeds: [
                new ErrorEmbed().setDescription("Failed to end the giveaway. Please try again or check permissions."),
              ],
              ephemeral: true,
            });
          }
        } finally {
          collector.stop();
        }
      },
    );

    collector.on("end", () => {
      response.edit({ components: [] }).catch(console.error);
    });
  } catch (error) {
    console.error("Error in confirmation flow:", error);
    if (interaction instanceof Message) {
      await interaction.reply({
        embeds: [new ErrorEmbed().setDescription("An error occurred during confirmation.")],
        allowedMentions: { repliedUser: false },
      });
    } else {
      await interaction.followUp({
        embeds: [new ErrorEmbed().setDescription("An error occurred during confirmation.")],
        ephemeral: true,
      });
    }
  }
}

function formatDuration(remainingTime: number): string {
  if (remainingTime <= 0) return "Ended";
  const seconds = Math.floor((remainingTime / 1000) % 60);
  const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
  const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && parts.length === 0) parts.push(`${seconds}s`); // Only show seconds if < 1m left

  return parts.join(" ");
}

export = GiveawayEnd;
