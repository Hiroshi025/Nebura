import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from "discord.js";

import { Precommand } from "@/typings/modules/discord";
import { ErrorEmbed } from "@utils/extenders/embeds.extend";

const ToolsChannel: Precommand = {
  name: "channel-tools",
  description: "Interactive channel management tools with extended features",
  examples: ["/channel-tools"],
  nsfw: false,
  owner: false,
  cooldown: 5,
  aliases: ["tools-channel", "tools", "channel-manage", "mod-tools"],
  botpermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(client, message) {
    console.log("DEBUG: Channel tools command initiated");
    if (!message.guild) return;

    if (!message.guild || !message.channel || !(message.channel instanceof TextChannel)) {
      console.log("DEBUG: Command not executed in a valid guild text channel");
      return message
        .reply({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} This command can only be used in a text channel.`,
                `Please use this command in a valid text channel.`,
                `If you are using this command in a thread, please use the main channel instead.`,
              ].join("\n"),
            ),
          ],
        })
        .catch(console.error);
    }

    try {
      // Main embed with channel information
      const embed = new EmbedBuilder()
        .setTitle(`Channel Tools - #${message.channel.name}`)
        .setDescription("Select an action to manage this channel. Tools will expire after 5 minutes of inactivity.")
        .setColor("#5865F2")
        .addFields(
          {
            name: "Current Settings",
            value: [
              `• Slowmode: ${message.channel.rateLimitPerUser || 0}s`,
              `• Locked: ${message.channel.permissionsFor(message.guild.roles.everyone)?.has(PermissionFlagsBits.SendMessages) ? "No" : "Yes"}`,
              `• NSFW: ${message.channel.nsfw ? "Yes" : "No"}`,
              `• Type: ${ChannelType[message.channel.type]}`,
            ].join("\n"),
            inline: true,
          },
          {
            name: "Statistics",
            value: [
              `• Created: <t:${Math.floor(message.channel.createdTimestamp / 1000)}:R>`,
              `• Messages: ${message.channel.messages.cache.size} cached`,
              `• Position: ${message.channel.position + 1}/${message.guild.channels.cache.size}`,
            ].join("\n"),
            inline: true,
          },
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        });

      // Primary action buttons
      const actionRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("slowmode")
          .setLabel("Set Slowmode")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏱️"),
        new ButtonBuilder()
          .setCustomId("lock_toggle")
          .setLabel(
            message.channel.permissionsFor(message.guild.roles.everyone)?.has(PermissionFlagsBits.SendMessages)
              ? "Lock"
              : "Unlock",
          )
          .setStyle(
            message.channel.permissionsFor(message.guild.roles.everyone)?.has(PermissionFlagsBits.SendMessages)
              ? ButtonStyle.Danger
              : ButtonStyle.Success,
          )
          .setEmoji(
            message.channel.permissionsFor(message.guild.roles.everyone)?.has(PermissionFlagsBits.SendMessages)
              ? "🔒"
              : "🔓",
          ),
        new ButtonBuilder().setCustomId("purge").setLabel("Purge Messages").setStyle(ButtonStyle.Danger).setEmoji("🗑️"),
        new ButtonBuilder().setCustomId("info").setLabel("Channel Info").setStyle(ButtonStyle.Secondary).setEmoji("ℹ️"),
      );

      // Secondary action buttons
      const actionRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("nsfw_toggle")
          .setLabel(message.channel.nsfw ? "Make SFW" : "Make NSFW")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("rename").setLabel("Rename Channel").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("clone").setLabel("Clone Channel").setStyle(ButtonStyle.Success),
      );

      console.log("DEBUG: Sending initial message with tools");
      const sentMessage = await message.channel.send({
        embeds: [embed],
        components: [actionRow1, actionRow2],
      });

      // Delete the original command message
      await message.delete().catch(() => console.log("DEBUG: Could not delete original message"));

      const collector = sentMessage.createMessageComponentCollector({
        time: 300000, // 5 minutes
        filter: (i) => i.user.id === message.author.id,
      });

      // Slowmode options
      const slowmodeOptions = [
        { label: "Off", value: "0", description: "No slowmode" },
        { label: "5 seconds", value: "5", description: "5s delay between messages" },
        { label: "10 seconds", value: "10", description: "10s delay between messages" },
        { label: "30 seconds", value: "30", description: "30s delay between messages" },
        { label: "1 minute", value: "60", description: "1m delay between messages" },
        { label: "5 minutes", value: "300", description: "5m delay between messages" },
        { label: "15 minutes", value: "900", description: "15m delay between messages" },
        { label: "1 hour", value: "3600", description: "1h delay between messages" },
        { label: "6 hours", value: "21600", description: "6h delay between messages" },
      ];

      // Purge amount options
      const purgeOptions = [
        { label: "10 messages", value: "10", description: "Delete last 10 messages" },
        { label: "25 messages", value: "25", description: "Delete last 25 messages" },
        { label: "50 messages", value: "50", description: "Delete last 50 messages" },
        { label: "100 messages", value: "100", description: "Delete last 100 messages" },
        { label: "All messages", value: "all", description: "Delete as many as possible" },
      ];

      collector.on("collect", async (interaction) => {
        console.log(`DEBUG: Collected interaction with ID: ${interaction.customId}`);
        if (!message.guild || message.channel.type !== ChannelType.GuildText) return;

        try {
          await interaction.deferUpdate();

          switch (interaction.customId) {
            case "slowmode":
              console.log("DEBUG: Slowmode menu requested");
              const slowmodeRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId("slowmode_select")
                  .setPlaceholder("Select slowmode duration")
                  .addOptions(
                    slowmodeOptions.map((opt) =>
                      new StringSelectMenuOptionBuilder()
                        .setLabel(opt.label)
                        .setValue(opt.value)
                        .setDescription(opt.description),
                    ),
                  ),
              );

              await interaction.editReply({
                content: "**⏱️ Set Channel Slowmode**\nSelect how long users must wait between messages:",
                components: [slowmodeRow],
              });
              break;

            case "lock_toggle":
              console.log("DEBUG: Lock toggle requested");
              const isLocked = !message.channel
                .permissionsFor(message.guild.roles.everyone)
                ?.has(PermissionFlagsBits.SendMessages);

              await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: isLocked ? null : false,
              });

              // Update the button state
              actionRow1.components[1]
                .setLabel(isLocked ? "Lock" : "Unlock")
                .setStyle(isLocked ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(isLocked ? "🔒" : "🔓");

              await interaction.editReply({
                content: isLocked
                  ? `🔓 Channel unlocked. Everyone can now send messages in ${message.channel}.`
                  : `🔒 Channel locked. Only users with special permissions can send messages in ${message.channel}.`,
                components: [actionRow1, actionRow2],
              });
              break;

            case "purge":
              console.log("DEBUG: Purge menu requested");
              const purgeRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId("purge_select")
                  .setPlaceholder("Select amount to delete")
                  .addOptions(
                    purgeOptions.map((opt) =>
                      new StringSelectMenuOptionBuilder()
                        .setLabel(opt.label)
                        .setValue(opt.value)
                        .setDescription(opt.description),
                    ),
                  ),
              );

              await interaction.editReply({
                content: "**⚠️ Purge Messages**\nSelect how many messages to delete (this cannot be undone):",
                components: [purgeRow],
              });
              break;

            case "info":
              console.log("DEBUG: Channel info requested");
              const infoEmbed = new EmbedBuilder()
                .setTitle(`📊 Detailed Channel Info - #${message.channel.name}`)
                .setColor("#7289DA")
                .addFields(
                  {
                    name: "Basic Information",
                    value: [
                      `• Name: ${message.channel.name}`,
                      `• ID: \`${message.channel.id}\``,
                      `• Created: <t:${Math.floor(message.channel.createdTimestamp / 1000)}:F> (<t:${Math.floor(message.channel.createdTimestamp / 1000)}:R>)`,
                      `• Type: ${ChannelType[message.channel.type]}`,
                      `• Category: ${message.channel.parent?.name || "None"}`,
                    ].join("\n"),
                  },
                  {
                    name: "Settings",
                    value: [
                      `• Slowmode: ${message.channel.rateLimitPerUser || 0}s`,
                      `• Locked: ${message.channel.permissionsFor(message.guild.roles.everyone)?.has(PermissionFlagsBits.SendMessages) ? "No" : "Yes"}`,
                      `• NSFW: ${message.channel.nsfw ? "Yes" : "No"}`,
                      `• Position: ${message.channel.position + 1}/${message.guild.channels.cache.size}`,
                    ].join("\n"),
                  },
                  {
                    name: "Statistics",
                    value: [
                      `• Messages cached: ${message.channel.messages.cache.size}`,
                      `• Members: ${message.channel.members?.size || "N/A"}`,
                      `• Last message: ${message.channel.lastMessageId ? `<t:${Math.floor((message.channel.lastMessage?.createdTimestamp || 0) / 1000)}:R>` : "None"}`,
                    ].join("\n"),
                  },
                )
                .setFooter({
                  text: `Channel ID: ${message.channel.id}`,
                  iconURL: message.guild.iconURL() || undefined,
                });

              await interaction.editReply({
                embeds: [infoEmbed],
                components: [actionRow1, actionRow2],
              });
              break;

            case "nsfw_toggle":
              console.log("DEBUG: NSFW toggle requested");
              if (!(message.channel instanceof TextChannel)) {
                await interaction.editReply({
                  content: "❌ NSFW setting can only be changed for text channels.",
                  components: [actionRow1, actionRow2],
                });
                return;
              }

              await message.channel.setNSFW(!message.channel.nsfw);

              // Update the button state
              actionRow2.components[0]
                .setLabel(message.channel.nsfw ? "Make SFW" : "Make NSFW")
                .setEmoji(message.channel.nsfw ? "🔞" : "👶");

              await interaction.editReply({
                content: message.channel.nsfw
                  ? "🔞 Channel marked as NSFW. Content may not be suitable for all audiences."
                  : "👶 Channel marked as SFW. Content should be appropriate for all audiences.",
                components: [actionRow1, actionRow2],
              });
              break;

            case "rename":
              console.log("DEBUG: Rename requested");
              await interaction.editReply({
                content: "✏️ Please reply with the new name for this channel (type `cancel` to abort):",
                components: [],
              });

              const nameCollector = message.channel.createMessageCollector({
                filter: (m) => m.author.id === interaction.user.id,
                time: 60000,
                max: 1,
              });

              nameCollector.on("collect", async (m) => {
                if (!message.guild || message.channel.type !== ChannelType.GuildText) return;

                if (m.content.toLowerCase() === "cancel") {
                  await m.reply("Channel rename cancelled.").then((msg) => setTimeout(() => msg.delete(), 5000));
                  return;
                }

                try {
                  await message.channel.setName(m.content);
                  await m.reply(`✅ Channel renamed to \`#${m.content}\``);
                } catch (error) {
                  await m.reply(
                    `❌ Failed to rename channel: ${error instanceof Error ? error.message : "Unknown error"}`,
                  );
                } finally {
                  await m.delete().catch(() => {});
                }
              });

              nameCollector.on("end", () => {
                interaction
                  .editReply({
                    content: "Channel tools panel",
                    components: [actionRow1, actionRow2],
                  })
                  .catch(console.error);
              });
              break;

            case "clone":
              console.log("DEBUG: Clone requested");
              try {
                const clone = await message.channel.clone();
                await interaction.editReply({
                  content: `✅ Channel cloned: ${clone}`,
                  components: [actionRow1, actionRow2],
                });
              } catch (error) {
                await interaction.editReply({
                  embeds: [
                    new ErrorEmbed().setDescription(
                      [
                        `${client.getEmoji(message.guild.id, "error")} Failed to clone channel: ${error instanceof Error ? error.message : "Unknown error"}`,
                        `Please try again later or contact support if the issue persists.`,
                      ].join("\n"),
                    ),
                  ],
                  components: [actionRow1, actionRow2],
                });
              }
              break;

            case "slowmode_select":
              console.log("DEBUG: Slowmode selected");
              if (!interaction.isStringSelectMenu()) return;

              const seconds = parseInt(interaction.values[0]);
              await message.channel.setRateLimitPerUser(seconds);

              await interaction.editReply({
                content:
                  seconds === 0
                    ? "⏱️ Slowmode has been disabled for this channel."
                    : `⏱️ Slowmode set to ${seconds} second${seconds === 1 ? "" : "s"} between messages.`,
                components: [actionRow1, actionRow2],
              });
              break;

            case "purge_select":
              console.log("DEBUG: Purge selected");
              if (!interaction.isStringSelectMenu()) return;

              const amount = interaction.values[0];
              let deleteCount = 0;

              if (amount === "all") {
                // Bulk delete as many as possible
                let messages = await message.channel.messages.fetch({ limit: 100 });
                while (messages.size > 0) {
                  await message.channel.bulkDelete(messages);
                  deleteCount += messages.size;
                  messages = await message.channel.messages.fetch({ limit: 100 });
                }
              } else {
                const count = parseInt(amount);
                const messages = await message.channel.messages.fetch({ limit: count });
                await message.channel.bulkDelete(messages);
                deleteCount = messages.size;
              }

              await interaction.editReply({
                content: `✅ Successfully deleted ${deleteCount} message${deleteCount === 1 ? "" : "s"}.`,
                components: [actionRow1, actionRow2],
              });
              break;
          }
        } catch (error) {
          console.error("DEBUG: Error handling interaction:", error);
          await interaction.reply({
            embeds: [
              new ErrorEmbed().setDescription(
                [
                  `${client.getEmoji(message.guild.id, "error")} An error occurred while processing your request.`,
                  `Please try again later or contact support if the issue persists.`,
                ].join("\n"),
              ),
            ],
            components: [actionRow1, actionRow2],
          });
        }
      });

      collector.on("end", () => {
        console.log("DEBUG: Collector ended, removing components");
        sentMessage
          .edit({
            components: [],
          })
          .catch(console.error);
      });
    } catch (error) {
      console.error("DEBUG: Error executing channel tools command:", error);
      message
        .reply({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} An error occurred while executing the command.`,
                `Please try again later or contact support if the issue persists.`,
              ].join("\n"),
            ),
          ],
        })
        .catch(console.error);
    }
  },
};

export = ToolsChannel;
