import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} from "discord.js";

import { Precommand } from "@typings/modules/discord";

const timeoutCommand: Precommand = {
  name: "timeout",
  nameLocalizations: {
    "es-ES": "silenciar",
    "en-US": "timeout",
  },
  description: "Manage user timeouts in the server",
  descriptionLocalizations: {
    "es-ES": "Gestiona los silencios de usuarios en el servidor",
    "en-US": "Manage user timeouts in the server",
  },
  examples: ["timeout add @user 30m Spamming", "timeout remove @user", "timeout list"],
  nsfw: false,
  owner: false,
  category: "Admin",
  cooldown: 5,
  subcommands: ["timeout add <@user> <duration> [reason]", "timeout remove <@user>", "timeout list"],
  aliases: ["mute", "temporalmute"],
  botpermissions: ["ModerateMembers"],
  permissions: ["ModerateMembers"],
  async execute(_client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    // Multilenguaje
    const userLang = message.guild?.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = _client.translations.getFixedT(lang, "discord");

    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(t("timeout.permissionDeniedTitle"))
            .setDescription(t("timeout.permissionDeniedDesc")),
        ],
      });
    }

    const subcommand = args[0]?.toLowerCase();
    const targetUser = message.mentions.members?.first() || message.guild.members.cache.get(args[1]);
    const reason = args.slice(2).join(" ") || t("timeout.noReason");

    switch (subcommand) {
      case "add":
        if (!targetUser) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(t("timeout.invalidUsageTitle"))
                .setDescription(t("timeout.invalidUsageDesc"))
                .addFields(
                  { name: t("timeout.exampleField"), value: "`timeout add @user 30m Spamming`" },
                  { name: t("timeout.timeFormatsField"), value: t("timeout.timeFormatsValue") },
                ),
            ],
          });
        }

        if (targetUser.id === message.author.id) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(t("timeout.invalidTargetTitle"))
                .setDescription(t("timeout.invalidTargetDesc")),
            ],
          });
        }

        if (!targetUser.moderatable) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(t("timeout.permissionDeniedTitle"))
                .setDescription(t("timeout.notModeratableDesc")),
            ],
          });
        }

        const timeString = args[2];
        if (!timeString) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(t("timeout.missingDurationTitle"))
                .setDescription(t("timeout.missingDurationDesc"))
                .addFields(
                  { name: t("timeout.exampleField"), value: "`timeout add @user 30m Spamming`" },
                  { name: t("timeout.timeFormatsField"), value: t("timeout.timeFormatsValue") },
                ),
            ],
          });
        }

        const duration = parseDuration(timeString);
        if (!duration || duration < 60000 || duration > 2419200000) {
          // Between 1 min and 28 days
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(t("timeout.invalidDurationTitle"))
                .setDescription(t("timeout.invalidDurationDesc"))
                .addFields(
                  { name: t("timeout.validFormatsField"), value: t("timeout.validFormatsValue") },
                  { name: t("timeout.examplesField"), value: t("timeout.examplesValue") },
                ),
            ],
          });
        }

        const timeoutUntil = new Date(Date.now() + duration);

        try {
          await targetUser.timeout(duration, `${reason} (${t("timeout.moderator")}: ${message.author.tag})`);

          // Confirmation message
          const embed = new EmbedBuilder()
            .setColor("#FFA500")
            .setTitle(t("timeout.userTimedOutTitle"))
            .setDescription(
              t("timeout.userTimedOutDesc", {
                user: `${targetUser}`,
                time: `<t:${Math.floor(timeoutUntil.getTime() / 1000)}:f>`,
              }),
            )
            .addFields(
              { name: t("timeout.reasonField"), value: reason, inline: true },
              { name: t("timeout.durationField"), value: formatDuration(duration, t), inline: true },
              { name: t("timeout.moderatorField"), value: message.author.toString(), inline: true },
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`untimeout_${targetUser.id}`)
              .setLabel(t("timeout.removeTimeoutButton"))
              .setStyle(ButtonStyle.Danger),
          );

          const reply = await message.reply({ embeds: [embed], components: [row] });

          // Collector for the remove timeout button
          const collector = reply.createMessageComponentCollector({ time: 60000 });

          collector.on("collect", async (i) => {
            if (i.customId === `untimeout_${targetUser.id}`) {
              if (!i.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
                return i.reply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor("#FF0000")
                      .setTitle(t("timeout.permissionDeniedTitle"))
                      .setDescription(t("timeout.removeTimeoutDeniedDesc")),
                  ],
                  flags: "Ephemeral"
                });
              }

              await targetUser.timeout(null);
              await i.update({
                embeds: [
                  embed
                    .setColor("#00FF00")
                    .setTitle(t("timeout.timeoutRemovedTitle"))
                    .setDescription(t("timeout.timeoutRemovedDesc", { user: `${targetUser}` })),
                ],
                components: [],
              });
              collector.stop();
            }

            return;
          });

          collector.on("end", () => {
            reply.edit({ components: [] }).catch(console.error);
          });
        } catch (error) {
          console.error("Error timing out user:", error);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(t("timeout.errorTitle"))
                .setDescription(t("timeout.errorDesc")),
            ],
          });
        }
        break;

      case "remove":
      case "delete":
      case "end":
        if (!targetUser) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(t("timeout.invalidUsageTitle"))
                .setDescription(t("timeout.invalidRemoveDesc"))
                .addFields({ name: t("timeout.exampleField"), value: "`timeout remove @user`" }),
            ],
          });
        }

        if (!targetUser.isCommunicationDisabled()) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFA500")
                .setTitle(t("timeout.noActiveTimeoutTitle"))
                .setDescription(t("timeout.noActiveTimeoutDesc", { user: `${targetUser}` })),
            ],
          });
        }

        try {
          await targetUser.timeout(null);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle(t("timeout.timeoutRemovedTitle"))
                .setDescription(t("timeout.timeoutRemovedSuccessDesc", { user: `${targetUser}` }))
                .addFields({ name: t("timeout.moderatorField"), value: message.author.toString() }),
            ],
          });
        } catch (error) {
          console.error("Error removing timeout:", error);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(t("timeout.errorTitle"))
                .setDescription(t("timeout.removeErrorDesc")),
            ],
          });
        }

      case "list":
        const timedOutMembers = await message.guild.members
          .fetch()
          .then((members) => members.filter((m) => m.isCommunicationDisabled()));

        if (timedOutMembers.size === 0) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#7289DA")
                .setTitle(t("timeout.activeTimeoutsTitle"))
                .setDescription(t("timeout.noTimeoutsDesc")),
            ],
          });
        }

        const embed = new EmbedBuilder()
          .setColor("#FFA500")
          .setTitle(t("timeout.activeTimeoutsListTitle", { count: timedOutMembers.size }))
          .setDescription(t("timeout.activeTimeoutsListDesc"));

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("timeout_details")
          .setPlaceholder(t("timeout.selectUserPlaceholder"))
          .setMinValues(1)
          .setMaxValues(1);

        timedOutMembers.forEach((member) => {
          const timeoutEnds = member.communicationDisabledUntil;
          const timeLeft = timeoutEnds ? Math.max(0, timeoutEnds.getTime() - Date.now()) : 0;

          embed.addFields({
            name: member.user.tag,
            value: t("timeout.timeoutEndsField", {
              time: `<t:${Math.floor(timeoutEnds!.getTime() / 1000)}:R>`,
              id: member.id,
            }),
            inline: true,
          });

          selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(member.user.tag)
              .setValue(member.id)
              .setDescription(t("timeout.timeoutEndsDesc", { time: formatDuration(timeLeft, t) })),
          );
        });

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        const reply = await message.reply({ embeds: [embed], components: [row] });

        // Collector for the select menu
        const collector = reply.createMessageComponentCollector({ time: 60000 });

        collector.on("collect", async (i) => {
          if (i.isStringSelectMenu() && i.customId === "timeout_details") {
            const memberId = i.values[0];
            const member = await message.guild?.members.fetch(memberId);

            if (!member || !member.isCommunicationDisabled()) {
              return i.reply({
                embeds: [
                  new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle(t("timeout.errorTitle"))
                    .setDescription(t("timeout.noLongerTimedOutDesc")),
                ],
                flags: "Ephemeral",
              });
            }

            const timeoutEnds = member.communicationDisabledUntil!;
            const timeLeft = timeoutEnds.getTime() - Date.now();

            const detailsEmbed = new EmbedBuilder()
              .setColor("#FFA500")
              .setTitle(t("timeout.detailsTitle", { user: member.user.tag }))
              .setThumbnail(member.displayAvatarURL())
              .addFields(
                { name: t("timeout.userField"), value: member.toString(), inline: true },
                { name: t("timeout.idField"), value: member.id, inline: true },
                {
                  name: t("timeout.timeoutEndsFieldShort"),
                  value: `<t:${Math.floor(timeoutEnds.getTime() / 1000)}:f>`,
                  inline: true,
                },
                { name: t("timeout.timeRemainingField"), value: formatDuration(timeLeft, t), inline: true },
              );

            const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`untimeout_${member.id}`)
                .setLabel(t("timeout.removeTimeoutButton"))
                .setStyle(ButtonStyle.Danger),
            );

            await i.reply({
              embeds: [detailsEmbed],
              components: [actionRow],
              flags: "Ephemeral",
            });
          }

          return;
        });

        collector.on("end", () => {
          reply.edit({ components: [] }).catch(console.error);
        });
        break;

      default:
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#7289DA")
              .setTitle(t("timeout.helpTitle"))
              .setDescription(t("timeout.helpDesc"))
              .addFields(
                { name: t("timeout.addTimeoutField"), value: "`timeout add @user 30m [reason]`", inline: true },
                { name: t("timeout.removeTimeoutField"), value: "`timeout remove @user`", inline: true },
                { name: t("timeout.listTimeoutsField"), value: "`timeout list`", inline: true },
                { name: t("timeout.timeFormatsField"), value: t("timeout.timeFormatsValue"), inline: false },
                { name: t("timeout.examplesField"), value: t("timeout.examplesValue"), inline: false },
              ),
          ],
        });
    }

    return;
  },
};

function parseDuration(timeString: string): number | null {
  const regex = /^(\d+)([mhd])$/i;
  const match = timeString.match(regex);

  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "m":
      return amount * 60 * 1000; // minutes
    case "h":
      return amount * 60 * 60 * 1000; // hours
    case "d":
      return amount * 24 * 60 * 60 * 1000; // days
    default:
      return null;
  }
}

function formatDuration(ms: number, t: any): string {
  if (ms <= 0) return t("timeout.durationZero");

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days} ${t("timeout.days", { count: days })}`);
  if (hours > 0) parts.push(`${hours} ${t("timeout.hours", { count: hours })}`);
  if (minutes > 0) parts.push(`${minutes} ${t("timeout.minutes", { count: minutes })}`);
  if (seconds > 0) parts.push(`${seconds} ${t("timeout.seconds", { count: seconds })}`);

  return parts.join(" ");
}

export = timeoutCommand;
