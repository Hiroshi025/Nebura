import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits,
	SlashCommandBuilder
} from "discord.js";

import { main } from "@/main";
import { Command } from "@/modules/discord/structure/utils/builders";

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
      if (
        !interaction.guild ||
        !interaction.channel ||
        interaction.channel.type !== ChannelType.GuildText
      )
        return;

      const guildId = interaction.guild.id;

      // Initial embed for configuration
      const embed = new EmbedBuilder()
        .setTitle("🎭 Reaction Role Configuration")
        .setDescription(
          "Please provide the ID of the message where you want to configure reaction roles.",
        )
        .setColor("Blue")
        .setFooter({ text: "You can cancel at any time using the cancel button." });

      const cancelButton = new ButtonBuilder()
        .setCustomId("cancel-reactionrole")
        .setLabel("❌ Cancel")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton);

      const statusMessage = await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
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
        if (
          !interaction.guild ||
          !interaction.channel ||
          interaction.channel.type !== ChannelType.GuildText
        )
          return;

        if (componentInteraction.user.id !== interaction.user.id) {
          return componentInteraction.reply({
            content: `${client.getEmoji(interaction.guild.id, "error")} You cannot interact with this configuration.`,
            ephemeral: true,
          });
        }

        if (componentInteraction.customId === "cancel-reactionrole") {
          await componentInteraction.update({
            content: `${client.getEmoji(interaction.guild.id, "error")} Reaction role configuration canceled.`,
            embeds: [],
            components: [],
          });
          collector.stop();
          return;
        }

        return;
      });

      // Step 2: Collect the message ID
      const messageCollector = interaction.channel?.createMessageCollector({
        filter: (msg) => msg.author.id === interaction.user.id,
        time: 60000,
      });

      messageCollector?.on("collect", async (msg) => {
        if (
          !interaction.guild ||
          !interaction.channel ||
          interaction.channel.type !== ChannelType.GuildText
        )
          return;

        try {
          if (!messageId) {
            messageId = msg.content;
            await msg.delete();

            await updateEmbed(
              "Now, react to this message with the emoji you want to use for the reaction role. Then, mention the role to assign.",
            );
          } else {
            const role = msg.mentions.roles.first();
            if (!role) {
              await msg.reply(
                `${client.getEmoji(interaction.guild.id, "error")} Please mention a valid role.`,
              );
              return;
            }

            const lastReaction = msg.reactions.cache.last();
            if (!lastReaction || !lastReaction.emoji.name) {
              await msg.reply(
                `${client.getEmoji(interaction.guild.id, "error")} Please react with a valid emoji.`,
              );
              return;
            }

            reactionRoles.push({ emoji: lastReaction.emoji.name, roleId: role.id });
            await msg.delete();

            await updateEmbed(
              `${client.getEmoji(interaction.guild.id, "correct")} Reaction role added: ${lastReaction.emoji.name} -> ${role.name}\n\nReact with another emoji or type \`done\` to finish.`,
            );
          }
        } catch (error) {
          console.error(error);
          await msg.reply(
            `${client.getEmoji(interaction.guild.id, "error")} An error occurred while processing your message.`,
          );
        }
      });

      messageCollector?.on("end", async () => {
        if (
          !interaction.guild ||
          !interaction.channel ||
          interaction.channel.type !== ChannelType.GuildText
        )
          return;

        if (reactionRoles.length === 0) {
          await interaction.editReply({
            content: `${client.getEmoji(interaction.guild.id, "error")} No reaction roles were configured.`,
            embeds: [],
            components: [],
          });
          return;
        }

        await updateEmbed("Do you want to allow multiple roles or restrict to one role per user?");

        const multipleButton = new ButtonBuilder()
          .setCustomId("multiple-roles")
          .setLabel("Allow Multiple Roles")
          .setStyle(ButtonStyle.Primary);

        const singleButton = new ButtonBuilder()
          .setCustomId("single-role")
          .setLabel("Restrict to One Role")
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          multipleButton,
          singleButton,
        );

        await interaction.editReply({
          embeds: [embed],
          components: [row],
        });

        const roleCollector = interaction.channel?.createMessageComponentCollector({
          time: 60000,
        });

        roleCollector?.on("collect", async (componentInteraction) => {
          if (
            !interaction.guild ||
            !interaction.channel ||
            interaction.channel.type !== ChannelType.GuildText
          )
            return;

          if (componentInteraction.user.id !== interaction.user.id) {
            return componentInteraction.reply({
              content: `${client.getEmoji(interaction.guild.id, "error")} You cannot interact with this configuration.`,
              ephemeral: true,
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
              content: `${client.getEmoji(interaction.guild.id, "correct")} Reaction roles configured successfully!`,
              embeds: [],
              components: [],
            });
          } catch (error) {
            console.error(error);
            await componentInteraction.update({
              content: `${client.getEmoji(interaction.guild.id, "error")} An error occurred while saving the configuration.`,
              embeds: [],
              components: [],
            });
          }

          return;
        });
      });
    } catch (error) {
      if (
        !interaction.guild ||
        !interaction.channel ||
        interaction.channel.type !== ChannelType.GuildText
      )
        return;

      console.error(error);
      await interaction.reply({
        content: `${client.getEmoji(interaction.guild.id, "error")} An unexpected error occurred while executing the command.`,
        ephemeral: true,
      });
    }
  },
);
