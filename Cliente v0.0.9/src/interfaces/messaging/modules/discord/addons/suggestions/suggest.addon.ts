import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, Colors, EmbedBuilder,
	MessageFlags, PermissionFlagsBits
} from "discord.js";

import { Addons } from "@/interfaces/messaging/modules/discord/structure/addons";
import { main } from "@/main";

import { EmbedConfig } from "./types";

export default new Addons(
  {
    name: "Suggest Manager",
    description: "Manage suggestions in the server.",
    author: "Hiroshi025",
    version: "1.0.0",
    bitfield: ["Administrator"],
  },
  async (client) => {
    // Default configuration
    const defaultEmbedConfig: EmbedConfig = {
      color: Colors.Blurple.toString(),
      footer: {
        text: "Want to suggest something? Type in this channel!",
      },
    };

    // Helper function to create progress bar
    function createProgressBar(percentage: number, length = 10) {
      const filled = Math.round((percentage / 100) * length);
      return `[${"█".repeat(filled)}${"░".repeat(length - filled)}] ${percentage.toFixed(1)}%`;
    }

    // Helper function to get last voter info
    async function getLastVoterInfo(guildId: string, voters: string[], downvoters: string[]) {
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

    // Event to handle suggestions
    client.on("messageCreate", async (message) => {
      if (message.author.bot) return await message.delete().catch(() => {});
      if (!message.guild) return;

      try {
        const myGuild = await main.prisma.myGuild.findUnique({
          where: { guildId: message.guild.id },
        });

        if (!myGuild || !myGuild.suggestChannel) return;
        if (message.channel.id !== myGuild.suggestChannel) return;

        // Delete original message
        await message.delete().catch(() => {});

        // Create suggestion embed
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
          embed.setImage(imageAttachment.url);
        }

        // Create buttons
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

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
          upvoteButton,
          downvoteButton,
          whoButton,
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
          approveButton,
          rejectButton,
        );

        // Send suggestion message
        const suggestionMessage = await message.channel.send({
          embeds: [embed],
          components: [row1, row2],
        });

        // Save to database
        await main.prisma.suggestion.create({
          data: {
            suggestId: `${message.guild.id}-${suggestionMessage.id}`,
            messageId: suggestionMessage.id,
            content: message.content,
            imageUrl: imageAttachment?.url,
            authorId: message.author.id,
            guildId: message.guild.id,
            status: "pending", // New status field
          },
        });
      } catch (error) {
        console.error("Error handling suggestion:", error);
      }
    });

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton() || !interaction.guild) return;

      try {
        const customId = interaction.customId;
        if (!customId.startsWith("suggest_")) return;

        const suggestion = await main.prisma.suggestion.findUnique({
          where: { messageId: interaction.message.id },
        });

        if (!suggestion) {
          return interaction.reply({
            content: "Suggestion not found in the database.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const myGuild = await main.prisma.myGuild.findUnique({
          where: { guildId: interaction.guild.id },
        });

        if (!myGuild || interaction.channelId !== myGuild.suggestChannel) {
          return interaction.reply({
            content: "This interaction is not allowed in this channel.",
            flags: MessageFlags.Ephemeral,
          });
        }

        // Check if suggestion is already resolved
        if (suggestion.status !== "pending" && !customId.startsWith("suggest_who")) {
          return interaction.reply({
            content: `This suggestion has already been ${suggestion.status}.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const userId = interaction.user.id;

        switch (customId) {
          case "suggest_upvote":
            if (suggestion.voters.includes(userId)) {
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

            await main.prisma.suggestion.update({
              where: { messageId: interaction.message.id },
              data: {
                upvotes,
                downvotes,
                voters: updatedVoters,
                downvoters: updatedDownvoters,
                lastVoter: userId,
              },
            });

            break;

          case "suggest_downvote":
            if (suggestion.downvoters.includes(userId)) {
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

            await main.prisma.suggestion.update({
              where: { messageId: interaction.message.id },
              data: {
                upvotes: upvotesDownvote,
                downvotes: downvotesDownvote,
                voters: updatedVotersDownvote,
                downvoters: updatedDownvotersDownvote,
                lastVoter: userId,
              },
            });

            break;

          case "suggest_who":
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
            // Check if user has admin permissions
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
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
            await main.prisma.suggestion.update({
              where: { messageId: interaction.message.id },
              data: {
                status: newStatus,
                resolvedBy: interaction.user.id,
                resolvedAt: new Date(),
              },
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
              } catch (error) {
                console.error(`Could not send DM to ${author.tag}`);
              }
            }

            // Send DM to owner if approved
            if (isApproval && owner && owner.id !== interaction.user.id) {
              try {
                await owner.send({
                  content: `A suggestion in your server ${guild.name} has been approved by ${interaction.user.tag}:\n\n${suggestion.content}`,
                });
              } catch (error) {
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

            return interaction.reply({
              content: `Suggestion has been ${statusMessage}.`,
              flags: MessageFlags.Ephemeral,
            });
        }

        // Update the message with new votes
        const updatedSuggestion = await main.prisma.suggestion.findUnique({
          where: { messageId: interaction.message.id },
        });

        if (!updatedSuggestion) return;

        // Calculate percentages
        const totalVotes = updatedSuggestion.upvotes + updatedSuggestion.downvotes;
        const upvotePercentage =
          totalVotes > 0 ? (updatedSuggestion.upvotes / totalVotes) * 100 : 0;
        const downvotePercentage =
          totalVotes > 0 ? (updatedSuggestion.downvotes / totalVotes) * 100 : 0;

        // Get last voter info
        const lastVoterInfo = await getLastVoterInfo(
          updatedSuggestion.guildId,
          updatedSuggestion.voters,
          updatedSuggestion.downvoters,
        );

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

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
          upvoteButton,
          downvoteButton,
          whoButton,
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
          approveButton,
          rejectButton,
        );

        await interaction.message.edit({
          embeds: [updatedEmbed],
          components: [row1, row2],
        });

        await interaction.deferUpdate();
      } catch (error) {
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
