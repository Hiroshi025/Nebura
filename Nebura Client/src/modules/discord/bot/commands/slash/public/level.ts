import { profileImage } from "discord-arts";
import { AttachmentBuilder, GuildMember, SlashCommandBuilder } from "discord.js";

import { main } from "@/main";
import { Command } from "@/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";

export default new Command(
  new SlashCommandBuilder()
    .setName("levels")
    .setNameLocalizations({
      "es-ES": "niveles",
    })
    .setDescription("👾 Check your level and experience")
    .setDescriptionLocalizations({
      "es-ES": "👾 Comprueba tu nivel y experiencia",
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setNameLocalizations({
          "es-ES": "ver",
        })
        .setDescription("👾 View your or another member’s level and exp progress")
        .setDescriptionLocalizations({
          "es-ES": "👾 Ver tu progreso de nivel y experiencia o el de otro miembro",
        })
        .addUserOption((option) =>
          option
            .setName("member")
            .setNameLocalizations({
              "es-ES": "miembro",
            })
            .setDescription("👾 Member you’d like to view")
            .setDescriptionLocalizations({
              "es-ES": "👾 Miembro del que te gustaría ver",
            }),
        ),
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !(interaction.member instanceof GuildMember))
      return;

    await interaction.deferReply(); // Asegura que la respuesta no tome demasiado tiempo

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "view": {
        try {
          const targetMember =
            (interaction.options.getMember("member") as GuildMember) || interaction.member;

          // Obtener datos del usuario desde la base de datos
          const user = await main.prisma.userLevel.findFirst({
            where: {
              userId: targetMember.user.id,
              guildId: interaction.guild.id,
            },
          });

          if (!user) {
            await interaction.followUp({
              embeds: [
                new ErrorEmbed()
                  .setColor("Red")
                  .setDescription(
                    `${client.getEmoji(interaction.guild.id, "error")} The user has not sent any messages yet. Start chatting to appear in the leaderboard.`,
                  ),
              ],
            });
            return;
          }

          // Datos visuales para la tarjeta de perfil
          const buffer = await profileImage(targetMember.id, {
            borderColor: user.borderColor || "#000000",
            presenceStatus: targetMember.presence?.status || "offline",
            customBackground: user.background || undefined,
            moreBackgroundBlur: !!user.blur,
            rankData: {
              currentXp: user.xp || 0,
              requiredXp: user.level * 100 || 100,
              level: user.level || 1,
              barColor: user.barColor || "#087996",
            },
          });

          const attachment = new AttachmentBuilder(buffer, {
            name: "profile.png",
          });

          // Responder con la tarjeta de perfil y detalles del nivel
          await interaction.followUp({
            embeds: [
              new EmbedCorrect()
                .setColor("Blue")
                .setDescription(
                  `> **Level:** ${user.level || 1}\n> **Experience:** ${user.xp || 0}`,
                )
                .setImage(`attachment://profile.png`),
            ],
            files: [attachment],
          });
        } catch (error) {
          console.error(error);
          await interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setColor("Red")
                .setDescription(
                  `${client.getEmoji(interaction.guild.id, "error")} An error occurred while fetching user data. Please try again later.`,
                ),
            ],
          });
        }
        break;
      }
    }
  },
);
