import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits,
	SlashCommandBuilder
} from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { main } from "@/main";
import { clientID } from "@/shared/class/DB";
import { ErrorEmbed } from "@utils/extends/embeds.extension";

export default new Command(
  new SlashCommandBuilder()
    .setName("reactionrole")
    .setNameLocalizations({
      "es-ES": "rol-reaccion",
    })
    .setDescription("Configure reaction roles for your server.")
    .setDescriptionLocalizations({
      "es-ES": "Configura roles de reacción para tu servidor.",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async (client, interaction) => {
    try {
      if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) return;

      // Detecta idioma preferido
      const lang = interaction.locale || interaction.guild?.preferredLocale || "es-ES";

      const guildId = interaction.guild.id;

      const dataClient = await main.DB.findClient(clientID);
      if (!dataClient || dataClient.maintenance) {
        return interaction.reply({
          embeds: [
            new ErrorEmbed()
              .setTitle(client.t("discord:reactionrole.maintenanceTitle", {}, lang))
              .setDescription(client.t("discord:reactionrole.maintenanceDesc", {}, lang)),
          ],
        });
      }

      // Embed inicial de configuración
      const embed = new EmbedBuilder()
        .setTitle(client.t("discord:reactionrole.configTitle", {}, lang))
        .setDescription(client.t("discord:reactionrole.configDesc", {}, lang))
        .setColor("Blue")
        .setFooter({ text: client.t("discord:reactionrole.cancelFooter", {}, lang) });

      const cancelButton = new ButtonBuilder()
        .setCustomId("cancel-reactionrole")
        .setLabel(client.t("discord:reactionrole.cancelButton", {}, lang))
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton);

      const statusMessage = await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: "Ephemeral",
      });

      let messageId: string | null = null;
      let reactionRoles: { emoji: string; roleId: string }[] = [];
      let removeOthers = false;

      const updateEmbed = async (description: string) => {
        embed.setDescription(description);
        await statusMessage.edit({ embeds: [embed] });
      };

      const collector = interaction.channel?.createMessageComponentCollector({
        time: 60000,
      });

      collector?.on("collect", async (componentInteraction) => {
        if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) return;

        if (componentInteraction.user.id !== interaction.user.id) {
          return componentInteraction.reply({
            content: `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:reactionrole.noInteract", {}, lang)}`,
            flags: "Ephemeral",
          });
        }

        if (componentInteraction.customId === "cancel-reactionrole") {
          await componentInteraction.update({
            content: `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:reactionrole.cancelled", {}, lang)}`,
            embeds: [],
            components: [],
          });
          collector.stop();
          return;
        }

        return;
      });

      // Paso 2: Recoger el ID del mensaje
      const messageCollector = interaction.channel?.createMessageCollector({
        filter: (msg) => msg.author.id === interaction.user.id,
        time: 60000,
      });

      messageCollector?.on("collect", async (msg) => {
        if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) return;

        try {
          if (!messageId) {
            messageId = msg.content;
            await msg.delete();

            await updateEmbed(client.t("discord:reactionrole.step2Desc", {}, lang));
          } else {
            const role = msg.mentions.roles.first();
            if (!role) {
              await msg.reply(
                `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:reactionrole.noRole", {}, lang)}`,
              );
              return;
            }

            const lastReaction = msg.reactions.cache.last();
            if (!lastReaction || !lastReaction.emoji.name) {
              await msg.reply(
                `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:reactionrole.noEmoji", {}, lang)}`,
              );
              return;
            }

            reactionRoles.push({ emoji: lastReaction.emoji.name, roleId: role.id });
            await msg.delete();

            await updateEmbed(
              `${client.getEmoji(interaction.guild.id, "correct")} ${client.t("discord:reactionrole.added", { emoji: lastReaction.emoji.name, role: role.name }, lang)}\n\n${client.t("discord:reactionrole.addMore", {}, lang)}`,
            );
          }
        } catch (error) {
          console.error(error);
          await msg.reply(
            `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:reactionrole.errorProcessing", {}, lang)}`,
          );
        }
      });

      messageCollector?.on("end", async () => {
        if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) return;

        if (reactionRoles.length === 0) {
          await interaction.editReply({
            content: `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:reactionrole.noneConfigured", {}, lang)}`,
            embeds: [],
            components: [],
          });
          return;
        }

        await updateEmbed(client.t("discord:reactionrole.multipleOrSingle", {}, lang));

        const multipleButton = new ButtonBuilder()
          .setCustomId("multiple-roles")
          .setLabel(client.t("discord:reactionrole.allowMultiple", {}, lang))
          .setStyle(ButtonStyle.Primary);

        const singleButton = new ButtonBuilder()
          .setCustomId("single-role")
          .setLabel(client.t("discord:reactionrole.restrictOne", {}, lang))
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(multipleButton, singleButton);

        await interaction.editReply({
          embeds: [embed],
          components: [row],
        });

        const roleCollector = interaction.channel?.createMessageComponentCollector({
          time: 60000,
        });

        roleCollector?.on("collect", async (componentInteraction) => {
          if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) return;

          if (componentInteraction.user.id !== interaction.user.id) {
            return componentInteraction.reply({
              content: `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:reactionrole.noInteract", {}, lang)}`,
              flags: "Ephemeral",
            });
          }

          if (componentInteraction.customId === "multiple-roles") {
            removeOthers = false;
          } else if (componentInteraction.customId === "single-role") {
            removeOthers = true;
          }

          try {
            await main.prisma.reactionRole.create({
              data: {
                guildId,
                messageId: messageId!,
                removeOthers,
                parameters: reactionRoles,
              },
            });

            await componentInteraction.update({
              content: `${client.getEmoji(interaction.guild.id, "correct")} ${client.t("discord:reactionrole.success", {}, lang)}`,
              embeds: [],
              components: [],
            });
          } catch (error) {
            console.error(error);
            await componentInteraction.update({
              content: `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:reactionrole.saveError", {}, lang)}`,
              embeds: [],
              components: [],
            });
          }

          return;
        });
      });
    } catch (error) {
      if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) return;

      console.error(error);
      await interaction.reply({
        content: `${client.getEmoji(interaction.guild.id, "error")} ${client.t("discord:reactionrole.unexpectedError", {}, interaction.locale || "es-ES")}`,
        flags: "Ephemeral",
      });
    }

    return;
  },
);
