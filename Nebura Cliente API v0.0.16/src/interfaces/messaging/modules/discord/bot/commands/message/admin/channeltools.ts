import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel
} from "discord.js";

import { Precommand } from "@/typings/modules/discord";
import { ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";

const ToolsChannel: Precommand = {
  name: "channel-tools",
  nameLocalizations: {
    "es-ES": "herramientas-canal",
    "en-US": "channel-tools",
  },
  description: "Interactive channel management tools with extended features",
  descriptionLocalizations: {
    "es-ES": "Herramientas interactivas de gestión de canales con funciones extendidas",
    "en-US": "Interactive channel management tools with extended features",
  },
  nsfw: false,
  category: "Admin",
  owner: false,
  cooldown: 5,
  aliases: ["tools-channel", "tools", "channel-manage", "mod-tools"],
  botpermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(client, message) {
    if (!message.guild) return;
    const lang = message.guild.preferredLocale || "es-ES";

    if (!message.guild || !message.channel || !(message.channel instanceof TextChannel)) {
      return message
        .reply({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:channeltools.onlyTextChannel", {}, lang)}`,
                client.t("discord:channeltools.useInTextChannel", {}, lang),
                client.t("discord:channeltools.threadHint", {}, lang),
              ].join("\n"),
            ),
          ],
        })
        .catch(console.error);
    }

    try {
      // Main embed with channel information
      const embed = new EmbedBuilder()
        .setTitle(client.t("discord:channeltools.panelTitle", { channel: `#${message.channel.name}` }, lang))
        .setDescription(client.t("discord:channeltools.panelDesc", {}, lang))
        .setColor("#5865F2")
        .addFields(
          {
            name: client.t("discord:channeltools.currentSettings", {}, lang),
            value: [
              `• ${client.t("discord:channeltools.slowmode", {}, lang)}: ${message.channel.rateLimitPerUser || 0}s`,
              `• ${client.t("discord:channeltools.locked", {}, lang)}: ${message.channel.permissionsFor(message.guild.roles.everyone)?.has(PermissionFlagsBits.SendMessages) ? client.t("common:no", {}, lang) : client.t("common:yes", {}, lang)}`,
              `• ${client.t("discord:channeltools.nsfw", {}, lang)}: ${message.channel.nsfw ? client.t("common:yes", {}, lang) : client.t("common:no", {}, lang)}`,
              `• ${client.t("discord:channeltools.type", {}, lang)}: ${ChannelType[message.channel.type]}`,
            ].join("\n"),
            inline: true,
          },
          {
            name: client.t("discord:channeltools.statistics", {}, lang),
            value: [
              `• ${client.t("discord:channeltools.created", {}, lang)}: <t:${Math.floor(message.channel.createdTimestamp / 1000)}:R>`,
              `• ${client.t("discord:channeltools.messages", {}, lang)}: ${message.channel.messages.cache.size} ${client.t("discord:channeltools.cached", {}, lang)}`,
              `• ${client.t("discord:channeltools.position", {}, lang)}: ${message.channel.position + 1}/${message.guild.channels.cache.size}`,
            ].join("\n"),
            inline: true,
          },
        )
        .setFooter({
          text: client.t("discord:channeltools.requestedBy", { user: message.author.tag }, lang),
          iconURL: message.author.displayAvatarURL(),
        });

      // Primary action buttons
      const actionRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("slowmode")
          .setLabel(client.t("discord:channeltools.slowmodeButton", {}, lang))
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏱️"),
        new ButtonBuilder()
          .setCustomId("lock_toggle")
          .setLabel(
            message.channel.permissionsFor(message.guild.roles.everyone)?.has(PermissionFlagsBits.SendMessages)
              ? client.t("discord:channeltools.lock", {}, lang)
              : client.t("discord:channeltools.unlock", {}, lang),
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
        new ButtonBuilder()
          .setCustomId("purge")
          .setLabel(client.t("discord:channeltools.purgeButton", {}, lang))
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️"),
        new ButtonBuilder()
          .setCustomId("info")
          .setLabel(client.t("discord:channeltools.infoButton", {}, lang))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("ℹ️"),
      );

      // Secondary action buttons
      const actionRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("nsfw_toggle")
          .setLabel(
            message.channel.nsfw
              ? client.t("discord:channeltools.makeSFW", {}, lang)
              : client.t("discord:channeltools.makeNSFW", {}, lang),
          )
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("rename")
          .setLabel(client.t("discord:channeltools.renameButton", {}, lang))
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("clone")
          .setLabel(client.t("discord:channeltools.cloneButton", {}, lang))
          .setStyle(ButtonStyle.Success),
      );

      const sentMessage = await message.channel.send({
        embeds: [embed],
        components: [actionRow1, actionRow2],
      });

      await message.delete().catch(() => {});

      const collector = sentMessage.createMessageComponentCollector({
        time: 300000, // 5 minutes
        filter: (i) => i.user.id === message.author.id,
      });

      // Slowmode options
      const slowmodeOptions = [
        {
          label: client.t("discord:channeltools.slowmodeOff", {}, lang),
          value: "0",
          description: client.t("discord:channeltools.slowmodeOffDesc", {}, lang),
        },
        {
          label: "5 " + client.t("discord:channeltools.seconds", {}, lang),
          value: "5",
          description: "5" + client.t("discord:channeltools.secondsDesc", {}, lang),
        },
        {
          label: "10 " + client.t("discord:channeltools.seconds", {}, lang),
          value: "10",
          description: "10" + client.t("discord:channeltools.secondsDesc", {}, lang),
        },
        {
          label: "30 " + client.t("discord:channeltools.seconds", {}, lang),
          value: "30",
          description: "30" + client.t("discord:channeltools.secondsDesc", {}, lang),
        },
        {
          label: "1 " + client.t("discord:channeltools.minute", {}, lang),
          value: "60",
          description: "1" + client.t("discord:channeltools.minuteDesc", {}, lang),
        },
        {
          label: "5 " + client.t("discord:channeltools.minutes", {}, lang),
          value: "300",
          description: "5" + client.t("discord:channeltools.minutesDesc", {}, lang),
        },
        {
          label: "15 " + client.t("discord:channeltools.minutes", {}, lang),
          value: "900",
          description: "15" + client.t("discord:channeltools.minutesDesc", {}, lang),
        },
        {
          label: "1 " + client.t("discord:channeltools.hour", {}, lang),
          value: "3600",
          description: "1" + client.t("discord:channeltools.hourDesc", {}, lang),
        },
        {
          label: "6 " + client.t("discord:channeltools.hours", {}, lang),
          value: "21600",
          description: "6" + client.t("discord:channeltools.hoursDesc", {}, lang),
        },
      ];

      // Purge amount options
      const purgeOptions = [
        {
          label: "10 " + client.t("discord:channeltools.messages", {}, lang),
          value: "10",
          description: client.t("discord:channeltools.deleteLast", { count: 10 }, lang),
        },
        {
          label: "25 " + client.t("discord:channeltools.messages", {}, lang),
          value: "25",
          description: client.t("discord:channeltools.deleteLast", { count: 25 }, lang),
        },
        {
          label: "50 " + client.t("discord:channeltools.messages", {}, lang),
          value: "50",
          description: client.t("discord:channeltools.deleteLast", { count: 50 }, lang),
        },
        {
          label: "100 " + client.t("discord:channeltools.messages", {}, lang),
          value: "100",
          description: client.t("discord:channeltools.deleteLast", { count: 100 }, lang),
        },
        {
          label: client.t("discord:channeltools.allMessages", {}, lang),
          value: "all",
          description: client.t("discord:channeltools.deleteAll", {}, lang),
        },
      ];

      collector.on("collect", async (interaction) => {
        if (!message.guild || message.channel.type !== ChannelType.GuildText) return;

        try {
          await interaction.deferUpdate();

          switch (interaction.customId) {
            case "slowmode":
              const slowmodeRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId("slowmode_select")
                  .setPlaceholder(client.t("discord:channeltools.slowmodePlaceholder", {}, lang))
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
                content: client.t("discord:channeltools.slowmodeSelect", {}, lang),
                components: [slowmodeRow],
              });
              break;

            case "lock_toggle":
              const isLocked = !message.channel
                .permissionsFor(message.guild.roles.everyone)
                ?.has(PermissionFlagsBits.SendMessages);

              await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: isLocked ? null : false,
              });

              actionRow1.components[1]
                .setLabel(
                  isLocked
                    ? client.t("discord:channeltools.lock", {}, lang)
                    : client.t("discord:channeltools.unlock", {}, lang),
                )
                .setStyle(isLocked ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(isLocked ? "🔒" : "🔓");

              await interaction.editReply({
                content: isLocked
                  ? client.t("discord:channeltools.unlocked", { channel: `${message.channel}` }, lang)
                  : client.t("discord:channeltools.lockedMsg", { channel: `${message.channel}` }, lang),
                components: [actionRow1, actionRow2],
              });
              break;

            case "purge":
              const purgeRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId("purge_select")
                  .setPlaceholder(client.t("discord:channeltools.purgePlaceholder", {}, lang))
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
                content: client.t("discord:channeltools.purgeSelect", {}, lang),
                components: [purgeRow],
              });
              break;

            case "info":
              const infoEmbed = new EmbedBuilder()
                .setTitle(
                  client.t("discord:channeltools.detailedInfoTitle", { channel: `#${message.channel.name}` }, lang),
                )
                .setColor("#7289DA")
                .addFields(
                  {
                    name: client.t("discord:channeltools.basicInfo", {}, lang),
                    value: [
                      `• ${client.t("discord:channeltools.name", {}, lang)}: ${message.channel.name}`,
                      `• ID: \`${message.channel.id}\``,
                      `• ${client.t("discord:channeltools.created", {}, lang)}: <t:${Math.floor(message.channel.createdTimestamp / 1000)}:F> (<t:${Math.floor(message.channel.createdTimestamp / 1000)}:R>)`,
                      `• ${client.t("discord:channeltools.type", {}, lang)}: ${ChannelType[message.channel.type]}`,
                      `• ${client.t("discord:channeltools.category", {}, lang)}: ${message.channel.parent?.name || client.t("common:none", {}, lang)}`,
                    ].join("\n"),
                  },
                  {
                    name: client.t("discord:channeltools.settings", {}, lang),
                    value: [
                      `• ${client.t("discord:channeltools.slowmode", {}, lang)}: ${message.channel.rateLimitPerUser || 0}s`,
                      `• ${client.t("discord:channeltools.locked", {}, lang)}: ${message.channel.permissionsFor(message.guild.roles.everyone)?.has(PermissionFlagsBits.SendMessages) ? client.t("common:no", {}, lang) : client.t("common:yes", {}, lang)}`,
                      `• ${client.t("discord:channeltools.nsfw", {}, lang)}: ${message.channel.nsfw ? client.t("common:yes", {}, lang) : client.t("common:no", {}, lang)}`,
                      `• ${client.t("discord:channeltools.position", {}, lang)}: ${message.channel.position + 1}/${message.guild.channels.cache.size}`,
                    ].join("\n"),
                  },
                  {
                    name: client.t("discord:channeltools.statistics", {}, lang),
                    value: [
                      `• ${client.t("discord:channeltools.messagesCached", {}, lang)}: ${message.channel.messages.cache.size}`,
                      `• ${client.t("discord:channeltools.members", {}, lang)}: ${message.channel.members?.size || client.t("common:na", {}, lang)}`,
                      `• ${client.t("discord:channeltools.lastMessage", {}, lang)}: ${message.channel.lastMessageId ? `<t:${Math.floor((message.channel.lastMessage?.createdTimestamp || 0) / 1000)}:R>` : client.t("common:none", {}, lang)}`,
                    ].join("\n"),
                  },
                )
                .setFooter({
                  text: client.t("discord:channeltools.channelId", { id: message.channel.id }, lang),
                  iconURL: message.guild.iconURL() || undefined,
                });

              await interaction.editReply({
                embeds: [infoEmbed],
                components: [actionRow1, actionRow2],
              });
              break;

            case "nsfw_toggle":
              if (!(message.channel instanceof TextChannel)) {
                await interaction.editReply({
                  content: client.t("discord:channeltools.nsfwOnlyText", {}, lang),
                  components: [actionRow1, actionRow2],
                });
                return;
              }

              await message.channel.setNSFW(!message.channel.nsfw);

              actionRow2.components[0]
                .setLabel(
                  message.channel.nsfw
                    ? client.t("discord:channeltools.makeSFW", {}, lang)
                    : client.t("discord:channeltools.makeNSFW", {}, lang),
                )
                .setEmoji(message.channel.nsfw ? "🔞" : "👶");

              await interaction.editReply({
                content: message.channel.nsfw
                  ? client.t("discord:channeltools.nsfwEnabled", {}, lang)
                  : client.t("discord:channeltools.nsfwDisabled", {}, lang),
                components: [actionRow1, actionRow2],
              });
              break;

            case "rename":
              await interaction.editReply({
                content: client.t("discord:channeltools.renamePrompt", {}, lang),
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
                  await m
                    .reply(client.t("discord:channeltools.renameCancelled", {}, lang))
                    .then((msg) => setTimeout(() => msg.delete(), 5000));
                  return;
                }

                try {
                  await message.channel.setName(m.content);
                  await m.reply(client.t("discord:channeltools.renamed", { name: m.content }, lang));
                } catch (error) {
                  await m.reply(
                    client.t(
                      "discord:channeltools.renameFailed",
                      { error: error instanceof Error ? error.message : "Unknown error" },
                      lang,
                    ),
                  );
                } finally {
                  await m.delete().catch(() => {});
                }
              });

              nameCollector.on("end", () => {
                interaction
                  .editReply({
                    content: client.t("discord:channeltools.panelReturn", {}, lang),
                    components: [actionRow1, actionRow2],
                  })
                  .catch(console.error);
              });
              break;

            case "clone":
              try {
                const clone = await message.channel.clone();
                await interaction.editReply({
                  content: client.t("discord:channeltools.cloned", { channel: `${clone}` }, lang),
                  components: [actionRow1, actionRow2],
                });
              } catch (error) {
                await interaction.editReply({
                  embeds: [
                    new ErrorEmbed().setDescription(
                      [
                        `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:channeltools.cloneFailed", { error: error instanceof Error ? error.message : "Unknown error" }, lang)}`,
                        client.t("discord:channeltools.tryAgain", {}, lang),
                      ].join("\n"),
                    ),
                  ],
                  components: [actionRow1, actionRow2],
                });
              }
              break;

            case "slowmode_select":
              if (!interaction.isStringSelectMenu()) return;

              const seconds = parseInt(interaction.values[0]);
              await message.channel.setRateLimitPerUser(seconds);

              await interaction.editReply({
                content:
                  seconds === 0
                    ? client.t("discord:channeltools.slowmodeDisabled", {}, lang)
                    : client.t("discord:channeltools.slowmodeSet", { seconds }, lang),
                components: [actionRow1, actionRow2],
              });
              break;

            case "purge_select":
              if (!interaction.isStringSelectMenu()) return;

              const amount = interaction.values[0];
              let deleteCount = 0;

              if (amount === "all") {
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
                content: client.t("discord:channeltools.purgeSuccess", { count: deleteCount }, lang),
                components: [actionRow1, actionRow2],
              });
              break;
          }
        } catch (error) {
          await interaction.reply({
            embeds: [
              new ErrorEmbed().setDescription(
                [
                  `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:channeltools.errorProcessing", {}, lang)}`,
                  client.t("discord:channeltools.tryAgain", {}, lang),
                ].join("\n"),
              ),
            ],
            components: [actionRow1, actionRow2],
          });
        }
      });

      collector.on("end", () => {
        sentMessage
          .edit({
            components: [],
          })
          .catch(console.error);
      });
    } catch (error) {
      message
        .reply({
          embeds: [
            new ErrorEmbed().setDescription(
              [
                `${client.getEmoji(message.guild.id, "error")} ${client.t("discord:channeltools.errorExecuting", {}, lang)}`,
                client.t("discord:channeltools.tryAgain", {}, lang),
              ].join("\n"),
            ),
          ],
        })
        .catch(console.error);
    }
  },
};

export default ToolsChannel;
