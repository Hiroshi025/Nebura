import { SlashCommandBuilder } from "discord.js";

import { main } from "@/main";
import { Command } from "@/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";

export default new Command(
  new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Get the logs of a user")
    .addSubcommand((subCmd) =>
      subCmd
        .setName("warns")
        .setDescription("Get the warns of a user")
        .addUserOption((option) => {
          return option
            .setName("user")
            .setDescription("User to get the warn logs for")
            .setRequired(true);
        })
        .addIntegerOption((option) => {
          return option
            .setName("page")
            .setDescription("The page to display if there are more than 1")
            .setMinValue(2)
            .setMaxValue(20);
        }),
    ),
  async (client, interaction) => {
    try {
      if (!interaction.guild || !interaction.channel || !interaction.user) return;

      switch (interaction.options.getSubcommand()) {
        case "warns": {
          const user = interaction.options.getUser("user");
          const page = interaction.options.getInteger("page") || 1; // Default to page 1 if not provided

          if (!user)
            return interaction.reply({
              embeds: [
                new ErrorEmbed().setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string, "error")} User Not Found`,
                    `Please provide a valid user.`,
                  ].join("\n"),
                ),
              ],
              flags: "Ephemeral",
            });

          const userWarnings = await main.prisma.userWarn.findMany({
            where: {
              userId: user.id,
              guildId: interaction.guild.id,
            },
          });

          if (!userWarnings?.length)
            return interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("No Warnings Found")
                  .setDescription(`This user has no warnings logged.`),
              ],
              flags: "Ephemeral",
            });

          if (page < 1 || page > Math.ceil(userWarnings.length / 5)) {
            return interaction.reply({
              embeds: [
                new ErrorEmbed()
                  .setTitle("Invalid Page Number")
                  .setDescription(
                    `The page number must be between 1 and ${Math.ceil(userWarnings.length / 5)}.`,
                  ),
              ],
              flags: "Ephemeral",
            });
          }

          const embed = new EmbedCorrect().setTitle(`${user.tag}'s Warning Logs`);

          const pageNum = 5 * (page - 1);

          if (userWarnings.length >= 6) {
            embed.setFooter({
              text: `Page ${page} of ${Math.ceil(userWarnings.length / 5)}`,
            });
          }

          for (const warnings of userWarnings.splice(pageNum, 5)) {
            const moderator = interaction.guild.members.cache.get(warnings.moderator);

            embed.addFields({
              name: `ID: ${warnings.id}`,
              value: [
                `> Moderator: ${moderator || "Moderator left"}`,
                `> User: ${warnings.userId}`,
                `> Reason: \`${warnings.warnReason}\``,
                `> Date: ${warnings.warnDate}`,
              ].join("\n"),
            });
          }

          return await interaction.reply({ embeds: [embed] });
        }

        default:
          return interaction.reply({
            content: "Invalid subcommand. Please use `/logs warns`.",
            flags: "Ephemeral",
          });
      }
    } catch (error) {
      console.error("Error handling logs command:", error);
      await interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Unexpected Error")
            .setDescription(
              "An unexpected error occurred while processing your request. Please try again later.",
            ),
        ],
        flags: "Ephemeral",
      });
    }

    return;
  },
);
