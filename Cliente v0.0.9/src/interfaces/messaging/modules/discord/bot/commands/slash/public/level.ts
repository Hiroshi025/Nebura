import { Profile } from "discord-arts";
import { AttachmentBuilder, EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js";

import { Command } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import {
	getTopUsers
} from "@/interfaces/messaging/modules/discord/structure/utils/ranking/helpers";
import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("top")
        .setNameLocalizations({
          "es-ES": "top",
        })
        .setDescription("🏆 View the top level ranking with achievements")
        .setDescriptionLocalizations({
          "es-ES": "🏆 Ver el ranking top de niveles con logros",
        }),
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !(interaction.member instanceof GuildMember)) return;

    // Obtener idioma preferido del usuario o guild
    const lang =
      (interaction.guild &&
        (await main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild.id } }))?.lenguage) ||
      interaction.locale ||
      "es-ES";
    const t = (key: string, options?: any) => client.translations.t("discord:" + key, { lng: lang, ...options });

    await interaction.deferReply(); // Ensure the response doesn't take too long

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "view": {
        try {
          const targetMember = (interaction.options.getMember("member") as GuildMember) || interaction.member;

          // Get user data from the database
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
                  .setDescription(`${client.getEmoji(interaction.guild.id, "error")} ${t("levels.errors.noMessages")}`),
              ],
            });
            return;
          }

          // Visual data for the profile card
          const buffer = await Profile(targetMember.id, {
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

          // Respond with the profile card and level details
          await interaction.followUp({
            embeds: [
              new EmbedCorrect()
                .setColor("Blue")
                .setDescription(
                  [`> **${t("levels.level")}:** ${user.level || 1}`, `> **${t("levels.exp")}:** ${user.xp || 0}`].join(
                    "\n",
                  ),
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
                .setDescription(`${client.getEmoji(interaction.guild.id, "error")} ${t("levels.errors.fetchUser")}`),
            ],
          });
        }
        break;
      }
      case "top": {
        try {
          // Get the top 10 users by level and XP
          const topUsers = await getTopUsers(interaction.guild.id, "xp", 10);

          if (!topUsers || topUsers.length === 0) {
            await interaction.followUp({
              embeds: [
                new ErrorEmbed()
                  .setColor("Red")
                  .setDescription(`${client.getEmoji(interaction.guild.id, "error")} ${t("levels.errors.noRanking")}`),
              ],
            });
            return;
          }

          // Get achievement details for each user
          const usersWithAchievements = await Promise.all(
            topUsers.map(async (user: any, i: any) => {
              const member = await interaction.guild!.members.fetch(user.userId).catch(() => null);
              const achievements = await main.prisma.userAchievements.findUnique({
                where: { userId_guildId: { userId: user.userId, guildId: interaction.guild!.id } },
              });
              return {
                position: i + 1,
                user,
                member,
                achievements: achievements?.achievements ?? [],
              };
            }),
          );

          // Build the ranking text
          const rankingText = usersWithAchievements
            .map(
              (entry: any) =>
                `**#${entry.position}** ${entry.member ? entry.member.user.tag : `<@${entry.user.userId}>`} - ${t("levels.level")}: **${entry.user.level}**${entry.user.prestige > 0 ? ` (P${entry.user.prestige})` : ""} - ${t("levels.exp")}: **${entry.user.xp}**\n${t("levels.achievements")}: ${
                  entry.achievements.length > 0 ? entry.achievements.map(() => `🏅`).join("") : t("levels.none")
                }`,
            )
            .join("\n\n");

          // Create the ranking embed
          const embed = new EmbedBuilder()
            .setTitle(t("levels.topTitle"))
            .setColor("Gold")
            .setDescription(rankingText)
            .setFooter({ text: t("levels.keepParticipating") });

          await interaction.followUp({ embeds: [embed] });
        } catch (error) {
          console.error(error);
          await interaction.followUp({
            embeds: [
              new ErrorEmbed()
                .setColor("Red")
                .setDescription(`${client.getEmoji(interaction.guild.id, "error")} ${t("levels.errors.fetchRanking")}`),
            ],
          });
        }
        break;
      }
    }
  },
);
