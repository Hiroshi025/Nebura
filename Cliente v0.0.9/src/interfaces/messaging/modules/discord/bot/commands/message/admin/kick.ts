import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";

import { Precommand } from "@typings/modules/discord";

const kickCommand: Precommand = {
  name: "kick",
  description: "Kick a user from the server",
  examples: ["kick @user Spamming", "kick @user"],
  nsfw: false,
  owner: false,
  cooldown: 5,
  category: "Admin",
  aliases: ["expulsar"],
  botpermissions: ["KickMembers"],
  permissions: ["KickMembers"],
  async execute(_client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Multilenguaje
    const userLang = message.guild?.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = _client.translations.getFixedT(lang, "discord");

    // Permission check
    if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(t("kick.permissionDeniedTitle"))
            .setDescription(t("kick.permissionDeniedDesc")),
        ],
      });
    }

    const targetUser = message.mentions.members?.first() || message.guild.members.cache.get(args[0]);
    const reason = args.slice(1).join(" ") || t("kick.noReason");

    if (!targetUser) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(t("kick.invalidUsageTitle"))
            .setDescription(t("kick.invalidUsageDesc"))
            .addFields({ name: t("kick.exampleField"), value: "`kick @user Spamming`" }),
        ],
      });
    }

    if (targetUser.id === message.author.id) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(t("kick.invalidTargetTitle"))
            .setDescription(t("kick.invalidTargetDesc")),
        ],
      });
    }

    if (!targetUser.kickable) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(t("kick.permissionDeniedTitle"))
            .setDescription(t("kick.notKickableDesc")),
        ],
      });
    }

    // Confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(t("kick.confirmTitle"))
      .setDescription(t("kick.confirmDesc", { user: `${targetUser}` }))
      .addFields(
        { name: t("kick.reasonField"), value: reason, inline: true },
        { name: t("kick.moderatorField"), value: message.author.toString(), inline: true },
      )
      .setThumbnail(targetUser.displayAvatarURL());

    const confirmButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("confirm_kick").setLabel(t("kick.confirmButton")).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("cancel_kick").setLabel(t("kick.cancelButton")).setStyle(ButtonStyle.Secondary),
    );

    const confirmationMessage = await message.reply({
      embeds: [confirmEmbed],
      components: [confirmButtons],
    });

    // Button collector
    const collector = confirmationMessage.createMessageComponentCollector({
      time: 30000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setTitle(t("kick.notAllowedTitle"))
              .setDescription(t("kick.notAllowedDesc")),
          ],
          flags: "Ephemeral",
        });
      }

      if (interaction.customId === "confirm_kick") {
        try {
          await targetUser.kick(t("kick.kickReason", { moderator: message.author.tag, reason }));

          const successEmbed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle(t("kick.successTitle"))
            .setDescription(t("kick.successDesc", { user: `${targetUser}` }))
            .addFields(
              { name: t("kick.reasonField"), value: reason, inline: true },
              { name: t("kick.moderatorField"), value: message.author.toString(), inline: true },
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

          await interaction.update({
            embeds: [successEmbed],
            components: [],
          });

          // DM the kicked user if possible
          try {
            const dmEmbed = new EmbedBuilder()
              .setColor("#FFA500")
              .setTitle(t("kick.dmTitle", { guild: message.guild?.name }))
              .addFields(
                { name: t("kick.reasonField"), value: reason },
                { name: t("kick.moderatorField"), value: message.author.tag },
              )
              .setFooter({ text: t("kick.dmFooter") });

            await targetUser.send({ embeds: [dmEmbed] });
          } catch (dmError) {
            // No DM sent
          }
        } catch (error) {
          await interaction.update({
            embeds: [
              new EmbedBuilder().setColor("#FF0000").setTitle(t("kick.errorTitle")).setDescription(t("kick.errorDesc")),
            ],
            components: [],
          });
        }
      } else if (interaction.customId === "cancel_kick") {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor("#7289DA")
              .setTitle(t("kick.cancelledTitle"))
              .setDescription(t("kick.cancelledDesc")),
          ],
          components: [],
        });
      }

      collector.stop();
      return;
    });

    collector.on("end", () => {
      confirmationMessage.edit({ components: [] }).catch(console.error);
    });

    return;
  },
};

export = kickCommand;
