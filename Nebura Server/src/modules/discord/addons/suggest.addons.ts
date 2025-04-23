import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, Colors, EmbedBuilder,
	MessageFlags
} from "discord.js";

import { main } from "@/main";
import { Addons } from "@/modules/discord/structure/addons";

interface EmbedConfig {
  color: string;
  footer?: {
    text: string;
    iconURL?: string;
  };
}

export default new Addons(
  {
    name: "Suggest Manager",
    description: "Manage suggestions in the server.",
    author: "Hiroshi025",
    version: "1.0.0",
    bitfield: ["Administrator"],
  },
  async (client) => {
    // Configuración por defecto
    const defaultEmbedConfig: EmbedConfig = {
      color: Colors.Blurple.toString(),
      footer: {
        text: "Want to suggest something? Type in this channel!",
      },
    };

    // Evento para manejar sugerencias
    client.on("messageCreate", async (message) => {
      if (message.author.bot || !message.guild) return;

      try {
        const myGuild = await main.prisma.myGuild.findUnique({
          where: { guildId: message.guild.id },
        });

        if (!myGuild || !myGuild.suggestChannel) return;
        if (message.channel.id !== myGuild.suggestChannel) return;

        // Eliminar el mensaje original
        await message.delete().catch(() => {});

        // Crear embed de sugerencia
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `${message.author.tag}'s Suggestion`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(message.content || "")
          .setColor(
            myGuild.embedColor && /^#[0-9A-F]{6}$/i.test(myGuild.embedColor) // Validar si es un color hexadecimal
              ? (myGuild.embedColor as ColorResolvable)
              : !isNaN(Number(myGuild.embedColor)) // Si es un número, convertirlo a entero
                ? (parseInt(myGuild.embedColor ?? "0", 10) as ColorResolvable)
                : (defaultEmbedConfig.color as ColorResolvable),
          )
          .setFooter({
            text: myGuild.footerText || defaultEmbedConfig.footer?.text || "",
            iconURL: message.guild.iconURL() || undefined,
          })
          .setThumbnail(message.author.displayAvatarURL())
          .addFields(
            { name: "👍 Up Votes", value: "```0 Votes```", inline: true },
            { name: "👎 Down Votes", value: "```0 Votes```", inline: true },
          );

        // Añadir imagen si existe
        const imageAttachment = message.attachments.find((attach) =>
          ["png", "jpeg", "jpg", "gif"].some((ext) => attach.url.toLowerCase().endsWith(ext)),
        );
        if (imageAttachment) {
          embed.setImage(imageAttachment.url);
        }

        // Crear botones
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

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          upvoteButton,
          downvoteButton,
          whoButton,
        );

        // Enviar mensaje de sugerencia
        const suggestionMessage = await message.channel.send({
          embeds: [embed],
          components: [row],
        });

        // Guardar en la base de datos
        await main.prisma.suggestion.create({
          data: {
            suggestId: `${message.guild.id}-${suggestionMessage.id}`, // Generate a unique ID
            messageId: suggestionMessage.id,
            content: message.content,
            imageUrl: imageAttachment?.url,
            authorId: message.author.id,
            guildId: message.guild.id,
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

        const userId = interaction.user.id;

        switch (customId) {
          case "suggest_upvote":
            if (suggestion.voters.includes(userId)) {
              return interaction.reply({
                content: "You can't upvote this suggestion twice!",
                flags: MessageFlags.Ephemeral,
              });
            }

            // Remover downvote si existe
            const updatedDownvoters = suggestion.downvoters.filter((id) => id !== userId);
            let downvotes = suggestion.downvotes;
            if (updatedDownvoters.length !== suggestion.downvoters.length) {
              downvotes--;
            }

            // Añadir upvote
            const updatedVoters = [...new Set([...suggestion.voters, userId])];
            const upvotes = suggestion.upvotes + 1;

            await main.prisma.suggestion.update({
              where: { messageId: interaction.message.id },
              data: {
                upvotes,
                downvotes,
                voters: updatedVoters,
                downvoters: updatedDownvoters,
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

            // Remover upvote si existe
            const updatedVotersDownvote = suggestion.voters.filter((id) => id !== userId);
            let upvotesDownvote = suggestion.upvotes;
            if (updatedVotersDownvote.length !== suggestion.voters.length) {
              upvotesDownvote--;
            }

            // Añadir downvote
            const updatedDownvotersDownvote = [...new Set([...suggestion.downvoters, userId])];
            const downvotesDownvote = suggestion.downvotes + 1;

            await main.prisma.suggestion.update({
              where: { messageId: interaction.message.id },
              data: {
                upvotes: upvotesDownvote,
                downvotes: downvotesDownvote,
                voters: updatedVotersDownvote,
                downvoters: updatedDownvotersDownvote,
              },
            });

            break;

          case "suggest_who":
            const embed = new EmbedBuilder()
              .setTitle("❓ Who reacted with what? ❓")
              .setColor(
                myGuild.embedColor && /^#[0-9A-F]{6}$/i.test(myGuild.embedColor) // Validar si es un color hexadecimal
                  ? (myGuild.embedColor as ColorResolvable)
                  : !isNaN(Number(myGuild.embedColor)) // Si es un número, convertirlo a entero
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
        }

        // Actualizar el mensaje con los nuevos votos
        const updatedSuggestion = await main.prisma.suggestion.findUnique({
          where: { messageId: interaction.message.id },
        });

        if (!updatedSuggestion) return;

        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]).spliceFields(
          0,
          2,
          {
            name: "👍 Up Votes",
            value: `\`\`\`${updatedSuggestion.upvotes} Votes\`\`\``,
            inline: true,
          },
          {
            name: "👎 Down Votes",
            value: `\`\`\`${updatedSuggestion.downvotes} Votes\`\`\``,
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

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          upvoteButton,
          downvoteButton,
          whoButton,
        );

        await interaction.message.edit({
          embeds: [updatedEmbed],
          components: [row],
        });

        await interaction.deferUpdate();
      } catch (error) {
        console.error("Error handling suggestion interaction:", error);
        interaction.reply({
          content: "An error occurred while processing your interaction.",
          flags: MessageFlags.Ephemeral,
        });
      }

      return;
    });
  },
);
