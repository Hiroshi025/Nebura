/* import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, ComponentType,
	EmbedBuilder, MessageComponentInteraction, PermissionFlagsBits, Role, RoleSelectMenuBuilder,
	StringSelectMenuBuilder, TextChannel
} from "discord.js";

import { Precommand, RoleAssignmentConfig } from "@/typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

//TODO: Arreglar los errores de respuesta, el codigo ya esta completo solo falta arreglar los errores de las interacciones
const AddRoleCommand: Precommand = {
  name: "addrole",
  description: "Assign roles to multiple server members",
  examples: ["addrole"],
  nsfw: false,
  owner: false,
  category: "Admin",
  cooldown: 5,
  aliases: ["massrole"],
  maintenance: true,
  botpermissions: [PermissionFlagsBits.ManageRoles],
  permissions: [PermissionFlagsBits.ManageRoles],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    const config: RoleAssignmentConfig = {
      roles: [],
      delay: 1000,
      target: "all",
      skipExisting: false,
      logChannel: null,
    };

    const botMember = await message.guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Permission Error")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} I need the \`Manage Roles\` permission to assign roles.`,
                "Please ensure that my role is above the roles you want to assign.",
              ].join("\n"),
            ),
        ],
      });
    }

    const mainEmbed = new EmbedBuilder()
      .setTitle("Role Assignment Configuration")
      .setColor("#0099ff")
      .setDescription("Configure mass role assignment")
      .addFields(
        {
          name: "Selected Roles",
          value: config.roles.length > 0 ? config.roles.map((id) => `<@&${id}>`).join(", ") : "None",
          inline: true,
        },
        {
          name: "Target",
          value: config.target === "all" ? "All members" : config.target === "bots" ? "Only bots" : "Only human users",
          inline: true,
        },
        {
          name: "Delay Between Assignments",
          value: `${config.delay / 1000} seconds`,
          inline: true,
        },
        {
          name: "Skip Existing Roles",
          value: config.skipExisting ? "Yes" : "No",
          inline: true,
        },
        {
          name: "Log Channel",
          value: config.logChannel ? `<#${config.logChannel}>` : "None",
          inline: true,
        },
      )
      .setFooter({ text: "Select roles and configure options" });

    const roleSelectRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("role_select")
        .setPlaceholder("Select up to 5 roles")
        .setMinValues(1)
        .setMaxValues(5),
    );

    const targetSelectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("target_select")
        .setPlaceholder("Select the target")
        .addOptions(
          { label: "All members", value: "all" },
          { label: "Only human users", value: "users" },
          { label: "Only bots", value: "bots" },
        ),
    );

    const optionsSelectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("options_select")
        .setPlaceholder("Additional options")
        .addOptions(
          { label: "Toggle Skip Existing", value: "toggle_skip" },
          { label: "Set Log Channel", value: "set_log" },
        ),
    );

    const delayButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("delay_1").setLabel("1s").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("delay_2").setLabel("2s").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("delay_5").setLabel("5s").setStyle(ButtonStyle.Secondary),
    );

    const actionButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel("Confirm Configuration")
        .setStyle(ButtonStyle.Success)
        .setDisabled(config.roles.length === 0),
      new ButtonBuilder().setCustomId("edit_roles").setLabel("Edit Roles").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger),
    );

    const response = await message.reply({
      embeds: [mainEmbed],
      components: [roleSelectRow, targetSelectRow, optionsSelectRow, delayButtonsRow, actionButtonsRow],
    });

    const collector = response.createMessageComponentCollector({
      filter: (interaction: MessageComponentInteraction) => {
        return interaction.user.id === message.author.id;
      },
      time: 300000,
    });

    collector.on("collect", async (interaction: MessageComponentInteraction) => {
      try {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            embeds: [new ErrorEmbed().setDescription("Only the command author can interact with this menu.")],
            flags: "Ephemeral",
          });
        }

        // Defer update for all interactions to prevent "InteractionNotReplied" errors
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferUpdate();
        }

        if (interaction.isButton()) {
          switch (interaction.customId) {
            case "delay_1":
              config.delay = 1000;
              break;
            case "delay_2":
              config.delay = 2000;
              break;
            case "delay_5":
              config.delay = 5000;
              break;
            case "confirm":
              await handleConfirmation(interaction);
              return;
            case "edit_roles":
              await interaction.followUp({
                content: "Select the roles you want to assign:",
                components: [roleSelectRow],
                flags: "Ephemeral",
              });
              return;
            case "cancel":
              await interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("Operation Cancelled")
                    .setDescription("Role assignment has been cancelled."),
                ],
                components: [],
              });
              collector.stop();
              return;
          }
        }

        if (interaction.isRoleSelectMenu() && interaction.customId === "role_select") {
          config.roles = interaction.values;
          actionButtonsRow.components[0].setDisabled(config.roles.length === 0);
        }

        if (interaction.isStringSelectMenu()) {
          if (interaction.customId === "target_select") {
            config.target = interaction.values[0] as "users" | "bots" | "all";
          } else if (interaction.customId === "options_select") {
            const selectedOption = interaction.values[0];
            if (selectedOption === "toggle_skip") {
              config.skipExisting = !config.skipExisting;
            } else if (selectedOption === "set_log") {
              // Prompt user to mention a log channel
              await interaction.followUp({
                content: "Please mention or provide the ID of the channel where you want to log the results:",
                flags: "Ephemeral",
              });

              // Collect channel message
              const channelFilter = (m: { author: { id: string } }) => m.author.id === interaction.user.id;
              try {
                const collected = await (interaction.channel as TextChannel).awaitMessages({
                  filter: channelFilter,
                  max: 1,
                  time: 60000,
                  errors: ["time"],
                });

                if (collected) {
                  const content = collected.first()?.content;
                  if (content) {
                    const channelMatch = content.match(/<#(\d+)>|(\d+)/);
                    const channelId = channelMatch?.[1] || channelMatch?.[2];
                    if (channelId) {
                      const channel = await message.guild?.channels.fetch(channelId);
                      if (channel && channel.isTextBased()) {
                        config.logChannel = channelId;
                        await collected.first()?.reply({
                          content: `Log channel set to ${channel.toString()}`,
                          flags: "SuppressNotifications",
                        });
                      } else {
                        await collected.first()?.reply({
                          content: "Invalid channel. Please provide a valid text channel.",
                          flags: "SuppressNotifications",
                        });
                      }
                    } else {
                      await collected.first()?.reply({
                        content: "No channel mentioned. Please mention a channel or provide its ID.",
                        flags: "SuppressNotifications",
                      });
                    }
                  }
                }
              } catch (error) {
                await interaction.followUp({
                  content: "Channel selection timed out or was cancelled.",
                  flags: "Ephemeral",
                });
              }
            }
          }
        }

        // Update the main embed with current configuration
        mainEmbed.setFields(
          {
            name: "Selected Roles",
            value: config.roles.length > 0 ? config.roles.map((id) => `<@&${id}>`).join(", ") : "None",
            inline: true,
          },
          {
            name: "Target",
            value:
              config.target === "all" ? "All members" : config.target === "bots" ? "Only bots" : "Only human users",
            inline: true,
          },
          {
            name: "Delay Between Assignments",
            value: `${config.delay / 1000} seconds`,
            inline: true,
          },
          {
            name: "Skip Existing Roles",
            value: config.skipExisting ? "Yes" : "No",
            inline: true,
          },
          {
            name: "Log Channel",
            value: config.logChannel ? `<#${config.logChannel}>` : "None",
            inline: true,
          },
        );

        await interaction.editReply({
          embeds: [mainEmbed],
          components: [roleSelectRow, targetSelectRow, optionsSelectRow, delayButtonsRow, actionButtonsRow],
        });
      } catch (error) {
        console.error("Error in interaction handler:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            embeds: [
              new ErrorEmbed()
                .setTitle("Interaction Error")
                .setDescription("An error occurred while processing your interaction."),
            ],
            flags: "Ephemeral",
          });
        } else {
          await interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setTitle("Interaction Error")
                .setDescription("An error occurred while processing your interaction."),
            ],
            flags: "Ephemeral",
          });
        }
      }

      return;
    });

    collector.on("end", () => {
      response.edit({ components: [] }).catch(console.error);
    });

    async function handleConfirmation(interaction: MessageComponentInteraction) {
      if (!message.guild) return;

      try {
        const authorMember = await message.guild.members.fetch(message.author.id);
        const botMember = await message.guild.members.fetchMe();

        const invalidRoles: string[] = [];
        const rolesToAssign: Role[] = [];

        // Verify valid roles
        for (const roleId of config.roles) {
          const role = await message.guild.roles.fetch(roleId);
          if (!role) continue;

          if (role.comparePositionTo(botMember.roles.highest) >= 0) {
            invalidRoles.push(role.name);
            continue;
          }

          if (role.comparePositionTo(authorMember.roles.highest) >= 0) {
            invalidRoles.push(role.name);
            continue;
          }

          rolesToAssign.push(role);
        }

        if (invalidRoles.length > 0) {
          await interaction.editReply({
            embeds: [
              new ErrorEmbed()
                .setTitle("Permission Error")
                .setDescription(
                  [
                    `${client.getEmoji(message.guild.id, "error")} Error: The following roles are not valid: ${invalidRoles.join(", ")}`,
                    "Make sure the bot's role is higher than the roles you want to assign.",
                  ].join("\n"),
                ),
            ],
          });
          return;
        }

        if (rolesToAssign.length === 0) {
          await interaction.editReply({
            embeds: [new ErrorEmbed().setTitle("Error").setDescription("No valid roles were selected for assignment.")],
          });
          return;
        }

        // Get and filter members
        let members = await message.guild.members.fetch();
        if (config.target === "bots") {
          members = members.filter((m) => m.user.bot);
        } else if (config.target === "users") {
          members = members.filter((m) => !m.user.bot);
        }

        if (members.size === 0) {
          await interaction.editReply({
            embeds: [
              new ErrorEmbed()
                .setTitle("No Members Found")
                .setDescription(`No members match the selected target: ${config.target}`),
            ],
            components: [],
          });
          return;
        }

        // Show final confirmation
        const confirmationEmbed = new EmbedCorrect()
          .setTitle("Final Confirmation")
          .setColor("#0099ff")
          .setDescription(`You are about to assign ${rolesToAssign.length} role(s) to ${members.size} member(s).`)
          .addFields(
            {
              name: "Roles",
              value: rolesToAssign.map((r) => r.toString()).join(", "),
              inline: true,
            },
            {
              name: "Target",
              value:
                config.target === "all" ? "All members" : config.target === "bots" ? "Only bots" : "Only human users",
              inline: true,
            },
            {
              name: "Delay",
              value: `${config.delay / 1000} seconds between assignments`,
              inline: true,
            },
            {
              name: "Skip Existing",
              value: config.skipExisting ? "Yes" : "No",
              inline: true,
            },
          );

        const confirmButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("final-confirm-addrole")
            .setLabel("Confirm Assignment")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("final-cancel-addrole").setLabel("Cancel").setStyle(ButtonStyle.Danger),
        );

        await interaction.editReply({
          embeds: [confirmationEmbed],
          components: [confirmButtons],
        });

        const updatedMessage = await interaction.fetchReply();

        // Collector for final confirmation
        const finalCollector = updatedMessage.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60000,
        });

        finalCollector.on("collect", async (finalInteraction: ButtonInteraction) => {
          try {
            if (finalInteraction.user.id !== message.author.id) {
              await finalInteraction.reply({
                embeds: [new ErrorEmbed().setDescription("Only the command author can confirm this action.")],
                flags: "Ephemeral",
              });
              return;
            }

            await finalInteraction.deferUpdate();

            if (finalInteraction.customId === "final-confirm-addrole") {
              const progressEmbed = new EmbedCorrect()
                .setTitle("Assigning Roles...")
                .setDescription(`Progress: 0/${members.size} (0%)`)
                .addFields(
                  { name: "Successes", value: "0", inline: true },
                  { name: "Failures", value: "0", inline: true },
                  { name: "Skipped", value: "0", inline: true },
                );

              const progressMessage = await updatedMessage.edit({
                embeds: [progressEmbed],
                components: [],
              });

              let successCount = 0;
              let failCount = 0;
              let skipCount = 0;

              // Create a log entry if log channel is specified
              let logMessage = null;
              if (config.logChannel) {
                try {
                  const logChannel = (await message.guild?.channels.fetch(config.logChannel)) as TextChannel;
                  if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                      .setTitle("Role Assignment Started")
                      .setColor("#0099ff")
                      .setDescription(`Mass role assignment initiated by ${message.author}`)
                      .addFields(
                        {
                          name: "Assigned Roles",
                          value: rolesToAssign.map((r) => r.toString()).join(", "),
                          inline: false,
                        },
                        { name: "Target Members", value: members.size.toString(), inline: true },
                        {
                          name: "Skip Existing",
                          value: config.skipExisting ? "Yes" : "No",
                          inline: true,
                        },
                      )
                      .setTimestamp();

                    logMessage = await logChannel.send({ embeds: [logEmbed] });
                  }
                } catch (logError) {
                  console.error("Failed to send log message:", logError);
                }
              }

              // Process members in batches to avoid rate limits
              const memberArray = Array.from(members.values());
              const batchSize = 10;
              const totalBatches = Math.ceil(memberArray.length / batchSize);

              for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                const batchStart = batchIndex * batchSize;
                const batchEnd = Math.min(batchStart + batchSize, memberArray.length);
                const currentBatch = memberArray.slice(batchStart, batchEnd);

                const batchPromises = currentBatch.map(async (member, index) => {
                  const memberIndex = batchStart + index;
                  try {
                    // Check if member already has all roles and skip if configured
                    if (config.skipExisting) {
                      const hasAllRoles = rolesToAssign.every((role) => member.roles.cache.has(role.id));
                      if (hasAllRoles) {
                        skipCount++;
                        return;
                      }
                    }

                    await member.roles.add(rolesToAssign);
                    successCount++;
                  } catch (error) {
                    console.error(`Failed to assign roles to ${member.user.tag}:`, error);
                    failCount++;
                  }

                  // Update progress every 10 members or at the end of each batch
                  if (index % 5 === 0 || index === currentBatch.length - 1) {
                    const progress = Math.floor(((memberIndex + 1) / members.size) * 100);
                    progressEmbed
                      .setDescription(`Progress: ${memberIndex + 1}/${members.size} (${progress}%)`)
                      .spliceFields(
                        0,
                        3,
                        { name: "Successes", value: successCount.toString(), inline: true },
                        { name: "Failures", value: failCount.toString(), inline: true },
                        { name: "Skipped", value: skipCount.toString(), inline: true },
                      );

                    await progressMessage.edit({
                      embeds: [progressEmbed],
                    });
                  }
                });

                await Promise.all(batchPromises);

                // Delay between batches if not the last batch
                if (batchIndex < totalBatches - 1) {
                  await new Promise((resolve) => setTimeout(resolve, config.delay));
                }
              }

              // Final result
              const resultEmbed = new EmbedCorrect()
                .setTitle("Role Assignment Complete")
                .setDescription(`Assigned ${rolesToAssign.length} role(s) to ${members.size} member(s)`)
                .addFields(
                  {
                    name: "Successful Assignments",
                    value: successCount.toString(),
                    inline: true,
                  },
                  {
                    name: "Failed Assignments",
                    value: failCount.toString(),
                    inline: true,
                  },
                  {
                    name: "Skipped Members",
                    value: skipCount.toString(),
                    inline: true,
                  },
                  {
                    name: "Assigned Roles",
                    value: rolesToAssign.map((r) => r.toString()).join(", "),
                  },
                );

              await progressMessage.edit({
                embeds: [resultEmbed],
              });

              // Update log channel if specified
              if (logMessage && config.logChannel) {
                try {
                  const logChannel = (await message.guild?.channels.fetch(config.logChannel)) as TextChannel;
                  if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                      .setTitle("Role Assignment Completed")
                      .setColor("#00ff00")
                      .setDescription(`Mass role assignment completed by ${message.author}`)
                      .addFields(
                        {
                          name: "Assigned Roles",
                          value: rolesToAssign.map((r) => r.toString()).join(", "),
                          inline: false,
                        },
                        { name: "Target Members", value: members.size.toString(), inline: true },
                        { name: "Successes", value: successCount.toString(), inline: true },
                        { name: "Failures", value: failCount.toString(), inline: true },
                        { name: "Skipped", value: skipCount.toString(), inline: true },
                      )
                      .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                  }
                } catch (logError) {
                  console.error("Failed to send completion log:", logError);
                }
              }

              finalCollector.stop();
            } else if (finalInteraction.customId === "final-cancel-addrole") {
              await updatedMessage.edit({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("Operation Cancelled")
                    .setDescription("Role assignment has been cancelled.")
                    .setColor("#ff0000"),
                ],
                components: [],
              });

              finalCollector.stop();
            }
          } catch (error) {
            console.error("Error in final confirmation:", error);
            await finalInteraction.followUp({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Unexpected Error")
                  .setDescription("An error occurred during role assignment."),
              ],
              flags: "Ephemeral",
            });
          }
        });

        finalCollector.on("end", () => {
          // Clean up if no interaction was received
          if (finalCollector.collected.size === 0) {
            updatedMessage.edit({ components: [] }).catch(console.error);
          }
        });
      } catch (error) {
        console.error("Error in handleConfirmation:", error);
        await interaction.editReply({
          embeds: [
            new ErrorEmbed()
              .setTitle("Unexpected Error")
              .setDescription("An error occurred while processing your request."),
          ],
          components: [],
        });
      }
    }

    return;
  },
};

export default AddRoleCommand;
 */
