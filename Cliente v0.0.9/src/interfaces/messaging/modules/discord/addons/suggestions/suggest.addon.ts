/**
 * Discord.js imports for building suggestion system UI and handling permissions.
 * @packageDocumentation
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  Colors,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";

/**
 * Import Addons structure for Discord modules.
 */
import { Addons } from "@/interfaces/messaging/modules/discord/structure/addons";
/**
 * Main application entry, used for accessing Prisma and client.
 */
import { main } from "@/main";
import { SuggestRepository } from "@domain/gateaway/shared/suggest.prisma.repository";

/**
 * Type definition for embed configuration.
 */
import { EmbedConfig } from "./types";

/**
 * Suggestion management Discord Addon.
 * Handles suggestion messages, voting, and admin approval/rejection.
 * @remarks
 * This Addon listens to messages in a configured suggestion channel,
 * creates suggestion embeds, manages voting via buttons, and allows
 * administrators to approve or reject suggestions.
 */
export default new Addons(
  {
    /**
     * Name of the Addon.
     */
    name: "Suggest Manager",
    /**
     * Description of the Addon functionality.
     */
    description: "Manage suggestions in the server.",
    /**
     * Author of the Addon.
     */
    author: "Hiroshi025",
    /**
     * Version of the Addon.
     */
    version: "1.0.0",
    /**
     * Required permission bitfields for the Addon.
     */
    bitfield: ["Administrator"],
  },
  /**
   * Main Addon logic.
   * @param client - The Discord client instance.
   */
  async (client) => {
    console.debug("[SuggestAddon] Addon initialized with client:", !!client);

    /**
     * Default embed configuration for suggestions.
     * @type {EmbedConfig}
     */
    const suggestRepository = new SuggestRepository();
    const defaultEmbedConfig: EmbedConfig = {
      color: Colors.Blurple.toString(),
      footer: {
        text: "Want to suggest something? Type in this channel!",
      },
    };

    /**
     * Helper function to create a visual progress bar for voting percentages.
     * @param percentage - The percentage of upvotes.
     * @param length - The total length of the progress bar (default: 10).
     * @returns The formatted progress bar string.
     */
    function createProgressBar(percentage: number, length = 10): string {
      console.debug("[SuggestAddon] Creating progress bar:", { percentage, length });
      const filled = Math.round((percentage / 100) * length);
      return `[${"█".repeat(filled)}${"░".repeat(length - filled)}] ${percentage.toFixed(1)}%`;
    }

    /**
     * Helper function to get information about the last user who voted.
     * @param guildId - The ID of the guild.
     * @param voters - Array of user IDs who upvoted.
     * @param downvoters - Array of user IDs who downvoted.
     * @returns A string describing the last voter and their action.
     */
    async function getLastVoterInfo(guildId: string, voters: string[], downvoters: string[]): Promise<string> {
      console.debug("[SuggestAddon] Getting last voter info:", { guildId, voters, downvoters });
      const allVoters = [...voters, ...downvoters];
      if (allVoters.length === 0) return "No votes yet";

      const lastVoterId = allVoters[allVoters.length - 1];
      try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(lastVoterId);
        return `${member.user.tag} (${voters.includes(lastVoterId) ? "Upvoted" : "Downvoted"})`;
      } catch {
        return `<@${lastVoterId}> (${voters.includes(lastVoterId) ? "Upvoted" : "Downvoted"})`;
      }
    }

    /**
     * Event listener for message creation.
     * Handles new suggestions posted in the suggestion channel.
     */
    client.on("messageCreate", async (message) => {
      if (!message.guild || !message.author) return;
      if (message.author.bot) return; // <-- Agrega esta línea

      try {
        /**
         * Fetch guild configuration from the database.
         */
        console.debug("[SuggestAddon] Fetching guild config from DB:", message.guild.id);
        const myGuild = await main.prisma.myGuild.findUnique({
          where: { guildId: message.guild.id },
        });

        if (!myGuild || !myGuild.suggestChannel) {
          console.debug("[SuggestAddon] Guild config or suggestChannel missing:", { myGuild });
          return;
        }
        if (message.channel.id !== myGuild.suggestChannel) {
          console.debug("[SuggestAddon] Message not in suggest channel:", {
            channelId: message.channel.id,
            suggestChannel: myGuild.suggestChannel,
          });
          return;
        }

        console.debug("[SuggestAddon] messageCreate event triggered:", {
          guild: !!message.guild,
          author: !!message.author,
          channelId: message.channel?.id,
          content: message.content,
        });
        //if (message.author.bot && message.author.id !== client.user?.id) return;

        // Delete original message
        await message.delete().catch((err) => {
          console.debug("[SuggestAddon] Error deleting original message:", err);
        });

        /**
         * Create the suggestion embed with voting fields and user info.
         */
        console.debug("[SuggestAddon] Creating suggestion embed for author:", message.author.id);
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `${message.author.tag}'s Suggestion`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(message.content || "")
          .setColor(
            myGuild.embedColor && /^#[0-9A-F]{6}$/i.test(myGuild.embedColor)
              ? (myGuild.embedColor as ColorResolvable)
              : !isNaN(Number(myGuild.embedColor))
                ? (parseInt(myGuild.embedColor ?? "0", 10) as ColorResolvable)
                : (defaultEmbedConfig.color as ColorResolvable),
          )
          .setFooter({
            text: myGuild.footerText || defaultEmbedConfig.footer?.text || "",
            iconURL: message.guild.iconURL() || undefined,
          })
          .setThumbnail(message.author.displayAvatarURL())
          .addFields(
            { name: "👍 Up Votes", value: "```0 Votes (0.0%)```", inline: true },
            { name: "👎 Down Votes", value: "```0 Votes (0.0%)```", inline: true },
            { name: "📊 Progress", value: "```" + createProgressBar(0) + "```", inline: false },
            { name: "🆔 Suggested By", value: `<@${message.author.id}>`, inline: true },
            { name: "⏱️ Last Voter", value: "```No votes yet```", inline: true },
          );

        // Add image if exists
        const imageAttachment = message.attachments.find((attach) =>
          ["png", "jpeg", "jpg", "gif"].some((ext) => attach.url.toLowerCase().endsWith(ext)),
        );
        if (imageAttachment) {
          console.debug("[SuggestAddon] Image attachment found:", imageAttachment.url);
          embed.setImage(imageAttachment.url);
        }

        /**
         * Create voting and admin action buttons for the suggestion.
         */
        console.debug("[SuggestAddon] Creating voting/admin buttons");
        const upvoteButton = new ButtonBuilder()
          .setCustomId("suggest_upvote")
          .setEmoji(myGuild.approveEmoji || "👍")
          .setLabel("0")
          .setStyle(ButtonStyle.Secondary);

        const downvoteButton = new ButtonBuilder()
          .setCustomId("suggest_downvote")
          .setEmoji(myGuild.denyEmoji || "👎")
          .setLabel("0")
          .setStyle(ButtonStyle.Secondary);

        const whoButton = new ButtonBuilder()
          .setCustomId("suggest_who")
          .setEmoji("❓")
          .setLabel("Who voted?")
          .setStyle(ButtonStyle.Primary);

        // Admin buttons (only visible to admins)
        const approveButton = new ButtonBuilder()
          .setCustomId("suggest_approve")
          .setEmoji("✅")
          .setLabel("Approve")
          .setStyle(ButtonStyle.Success);

        const rejectButton = new ButtonBuilder()
          .setCustomId("suggest_reject")
          .setEmoji("❌")
          .setLabel("Reject")
          .setStyle(ButtonStyle.Danger);

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButton, downvoteButton, whoButton);

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(approveButton, rejectButton);

        /**
         * Send the suggestion message to the channel.
         */
        console.debug("[SuggestAddon] Sending suggestion message to channel");
        const suggestionMessage = await message.channel.send({
          embeds: [embed],
          components: [row1, row2],
        });

        /**
         * Save the suggestion details to the database.
         */
        console.debug("[SuggestAddon] Saving suggestion to DB:", {
          suggestId: `${message.guild.id}-${suggestionMessage.id}`,
          messageId: suggestionMessage.id,
          authorId: message.author.id,
        });
        await suggestRepository.createSuggest({
          suggestId: `${message.guild.id}-${suggestionMessage.id}`,
          messageId: suggestionMessage.id,
          content: message.content,
          imageUrl: imageAttachment ? imageAttachment.url : null,
          authorId: message.author.id,
          guildId: message.guild.id,
          status: "pending", // New status field
        });
      } catch (error) {
        console.debug("[SuggestAddon] Error in messageCreate handler:", error);
        console.error("Error handling suggestion:", error);
      }
    });

    client.on("interactionCreate", async (interaction) => {
      console.debug("[SuggestAddon] interactionCreate event triggered:", {
        isButton: interaction.isButton(),
        guild: !!interaction.guild,
        customId: interaction.isButton() ? interaction.customId : undefined,
      });
      if (!interaction.isButton() || !interaction.guild) return;

      try {
        const customId = interaction.customId;
        console.debug("[SuggestAddon] Handling button interaction:", customId);

        if (!customId.startsWith("suggest_")) {
          console.debug("[SuggestAddon] Not a suggestion interaction:", customId);
          return;
        }

        const suggestion = await suggestRepository.getSuggestById(interaction.message.id);
        console.debug("[SuggestAddon] Fetched suggestion from DB:", suggestion);

        if (!suggestion) {
          console.debug("[SuggestAddon] Suggestion not found in DB for message:", interaction.message.id);
          return interaction.reply({
            content: "Suggestion not found in the database.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const myGuild = await main.prisma.myGuild.findUnique({
          where: { guildId: interaction.guild.id },
        });
        console.debug("[SuggestAddon] Fetched guild config for interaction:", myGuild);

        if (!myGuild || interaction.channelId !== myGuild.suggestChannel) {
          console.debug("[SuggestAddon] Interaction not allowed in this channel:", {
            channelId: interaction.channelId,
            suggestChannel: myGuild?.suggestChannel,
          });
          return interaction.reply({
            content: "This interaction is not allowed in this channel.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (suggestion.status !== "pending" && !customId.startsWith("suggest_who")) {
          console.debug("[SuggestAddon] Suggestion already resolved:", suggestion.status);
          return interaction.reply({
            content: `This suggestion has already been ${suggestion.status}.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const userId = interaction.user.id;
        console.debug("[SuggestAddon] Processing interaction for user:", userId);

        switch (customId) {
          case "suggest_upvote":
            console.debug("[SuggestAddon] Upvote button pressed by:", userId);
            if (suggestion.voters.includes(userId)) {
              console.debug("[SuggestAddon] User already upvoted:", userId);
              return interaction.reply({
                content: "You can't upvote this suggestion twice!",
                flags: MessageFlags.Ephemeral,
              });
            }

            // Remove downvote if exists
            const updatedDownvoters = suggestion.downvoters.filter((id) => id !== userId);
            let downvotes = suggestion.downvotes;
            if (updatedDownvoters.length !== suggestion.downvoters.length) {
              downvotes--;
            }

            // Add upvote
            const updatedVoters = [...new Set([...suggestion.voters, userId])];
            const upvotes = suggestion.upvotes + 1;

            await suggestRepository.updateUpvote(
              {
                upvotes,
                downvotes,
                voters: updatedVoters,
                downvoters: updatedDownvoters,
                lastVoter: userId,
              },
              interaction.message.id,
            );
            console.debug("[SuggestAddon] Upvote updated in DB for:", interaction.message.id);
            break;

          case "suggest_downvote":
            console.debug("[SuggestAddon] Downvote button pressed by:", userId);
            if (suggestion.downvoters.includes(userId)) {
              console.debug("[SuggestAddon] User already downvoted:", userId);
              return interaction.reply({
                content: "You can't downvote this suggestion twice!",
                flags: MessageFlags.Ephemeral,
              });
            }

            // Remove upvote if exists
            const updatedVotersDownvote = suggestion.voters.filter((id) => id !== userId);
            let upvotesDownvote = suggestion.upvotes;
            if (updatedVotersDownvote.length !== suggestion.voters.length) {
              upvotesDownvote--;
            }

            // Add downvote
            const updatedDownvotersDownvote = [...new Set([...suggestion.downvoters, userId])];
            const downvotesDownvote = suggestion.downvotes + 1;

            await suggestRepository.updateDownvote(
              {
                downvotes: downvotesDownvote,
                voters: updatedVotersDownvote,
                downvoters: updatedDownvotersDownvote,
                lastVoter: userId,
              },
              interaction.message.id,
            );
            console.debug("[SuggestAddon] Downvote updated in DB for:", interaction.message.id);
            break;

          case "suggest_who":
            console.debug("[SuggestAddon] Who voted button pressed");
            const embed = new EmbedBuilder()
              .setTitle("❓ Who reacted with what? ❓")
              .setColor(
                myGuild.embedColor && /^#[0-9A-F]{6}$/i.test(myGuild.embedColor)
                  ? (myGuild.embedColor as ColorResolvable)
                  : !isNaN(Number(myGuild.embedColor))
                    ? (parseInt(myGuild.embedColor ?? "0", 10) as ColorResolvable)
                    : (defaultEmbedConfig.color as ColorResolvable),
              )
              .addFields(
                {
                  name: `${suggestion.upvotes} Upvotes`,
                  value:
                    suggestion.voters.length > 0
                      ? suggestion.voters
                          .slice(0, 20)
                          .map((id) => `<@${id}>`)
                          .join("\n")
                      : "No one",
                  inline: true,
                },
                {
                  name: `${suggestion.downvotes} Downvotes`,
                  value:
                    suggestion.downvoters.length > 0
                      ? suggestion.downvoters
                          .slice(0, 20)
                          .map((id) => `<@${id}>`)
                          .join("\n")
                      : "No one",
                  inline: true,
                },
              );

            return interaction.reply({
              embeds: [embed],
              flags: MessageFlags.Ephemeral,
            });

          case "suggest_approve":
          case "suggest_reject":
            console.debug("[SuggestAddon] Admin action button pressed:", customId, "by", userId);
            // Check if user has admin permissions
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
              console.debug("[SuggestAddon] User lacks admin permissions:", userId);
              return interaction.reply({
                content: "You don't have permission to manage suggestions.",
                flags: MessageFlags.Ephemeral,
              });
            }

            const isApproval = customId === "suggest_approve";
            const newStatus = isApproval ? "approved" : "rejected";
            const statusColor = isApproval ? Colors.Green : Colors.Red;
            const statusMessage = isApproval ? "approved" : "rejected";

            // Update suggestion status
            await suggestRepository.updateStatus(interaction.message.id, newStatus, interaction.user.id);
            console.debug("[SuggestAddon] Suggestion status updated in DB:", {
              messageId: interaction.message.id,
              newStatus,
              resolvedBy: interaction.user.id,
            });
            // Get the author and guild owner
            const author = await client.users.fetch(suggestion.authorId).catch(() => null);
            const guild = await client.guilds.fetch(suggestion.guildId);
            const owner = await guild.fetchOwner();

            // Send DM to author
            if (author) {
              try {
                await author.send({
                  content: `Your suggestion in ${guild.name} has been ${statusMessage}:\n\n${suggestion.content}`,
                });
                console.debug("[SuggestAddon] DM sent to suggestion author:", author.id);
              } catch (error) {
                console.debug("[SuggestAddon] Could not send DM to author:", author.id, error);
                console.error(`Could not send DM to ${author.tag}`);
              }
            }

            // Send DM to owner if approved
            if (isApproval && owner && owner.id !== interaction.user.id) {
              try {
                await owner.send({
                  content: `A suggestion in your server ${guild.name} has been approved by ${interaction.user.tag}:\n\n${suggestion.content}`,
                });
                console.debug("[SuggestAddon] DM sent to server owner:", owner.id);
              } catch (error) {
                console.debug("[SuggestAddon] Could not send DM to server owner:", owner.id, error);
                console.error(`Could not send DM to server owner ${owner.user.tag}`);
              }
            }

            // Update the message
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
              .setColor(statusColor)
              .setFooter({
                text: `Suggestion ${statusMessage} by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
              });

            // Disable all buttons
            const disabledUpvote = new ButtonBuilder()
              .setCustomId("suggest_upvote")
              .setEmoji(myGuild.approveEmoji || "👍")
              .setLabel(suggestion.upvotes.toString())
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true);

            const disabledDownvote = new ButtonBuilder()
              .setCustomId("suggest_downvote")
              .setEmoji(myGuild.denyEmoji || "👎")
              .setLabel(suggestion.downvotes.toString())
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true);

            const disabledWho = new ButtonBuilder()
              .setCustomId("suggest_who")
              .setEmoji("❓")
              .setLabel("Who voted?")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true);

            const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              disabledUpvote,
              disabledDownvote,
              disabledWho,
            );

            await interaction.message.edit({
              embeds: [updatedEmbed],
              components: [disabledRow],
            });
            console.debug("[SuggestAddon] Suggestion message edited after admin action");
            return interaction.reply({
              content: `Suggestion has been ${statusMessage}.`,
              flags: MessageFlags.Ephemeral,
            });
        }

        // Update the message with new votes
        const updatedSuggestion = await suggestRepository.getSuggestById(interaction.message.id);
        console.debug("[SuggestAddon] Refetched updated suggestion from DB:", updatedSuggestion);
        if (!updatedSuggestion) return;

        // Calculate percentages
        const totalVotes = updatedSuggestion.upvotes + updatedSuggestion.downvotes;
        const upvotePercentage = totalVotes > 0 ? (updatedSuggestion.upvotes / totalVotes) * 100 : 0;
        const downvotePercentage = totalVotes > 0 ? (updatedSuggestion.downvotes / totalVotes) * 100 : 0;

        // Get last voter info
        const lastVoterInfo = await getLastVoterInfo(
          updatedSuggestion.guildId,
          updatedSuggestion.voters,
          updatedSuggestion.downvoters,
        );
        console.debug("[SuggestAddon] Last voter info:", lastVoterInfo);

        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]).spliceFields(
          0,
          5,
          {
            name: "👍 Up Votes",
            value: `\`\`\`${updatedSuggestion.upvotes} Votes (${upvotePercentage.toFixed(1)}%)\`\`\``,
            inline: true,
          },
          {
            name: "👎 Down Votes",
            value: `\`\`\`${updatedSuggestion.downvotes} Votes (${downvotePercentage.toFixed(1)}%)\`\`\``,
            inline: true,
          },
          {
            name: "📊 Progress",
            value: "```" + createProgressBar(upvotePercentage) + "```",
            inline: false,
          },
          {
            name: "🆔 Suggested By",
            value: `<@${updatedSuggestion.authorId}>`,
            inline: true,
          },
          {
            name: "⏱️ Last Voter",
            value: `\`\`\`${lastVoterInfo}\`\`\``,
            inline: true,
          },
        );

        const upvoteButton = new ButtonBuilder()
          .setCustomId("suggest_upvote")
          .setEmoji(myGuild.approveEmoji || "👍")
          .setLabel(updatedSuggestion.upvotes.toString())
          .setStyle(ButtonStyle.Secondary);

        const downvoteButton = new ButtonBuilder()
          .setCustomId("suggest_downvote")
          .setEmoji(myGuild.denyEmoji || "👎")
          .setLabel(updatedSuggestion.downvotes.toString())
          .setStyle(ButtonStyle.Secondary);

        const whoButton = new ButtonBuilder()
          .setCustomId("suggest_who")
          .setEmoji("❓")
          .setLabel("Who voted?")
          .setStyle(ButtonStyle.Primary);

        // Admin buttons
        const approveButton = new ButtonBuilder()
          .setCustomId("suggest_approve")
          .setEmoji("✅")
          .setLabel("Approve")
          .setStyle(ButtonStyle.Success);

        const rejectButton = new ButtonBuilder()
          .setCustomId("suggest_reject")
          .setEmoji("❌")
          .setLabel("Reject")
          .setStyle(ButtonStyle.Danger);

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButton, downvoteButton, whoButton);

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(approveButton, rejectButton);

        await interaction.message.edit({
          embeds: [updatedEmbed],
          components: [row1, row2],
        });
        console.debug("[SuggestAddon] Suggestion message edited after vote");

        await interaction.deferUpdate();
        console.debug("[SuggestAddon] Interaction deferred update called");
      } catch (error) {
        console.debug("[SuggestAddon] Error in interactionCreate handler:", error);
        console.error("Error handling suggestion interaction:", error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "An error occurred while processing your interaction.",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "An error occurred while processing your interaction.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      return;
    });
  },
);
