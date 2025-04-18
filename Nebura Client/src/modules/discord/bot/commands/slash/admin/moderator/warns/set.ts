import { PermissionFlagsBits, SlashCommandBuilder, TextChannel, time } from "discord.js";

import { main } from "@/main";
import { Command } from "@/modules/discord/structure/utils/builders";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";

export default new Command(
  new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setName("warn")
    .setDescription("Warn a user or remove a warn")
    .addSubcommand((subCmd) =>
      subCmd
        .setName("add")
        .setDescription("Warn a user")
        .addUserOption((option) => {
          return option.setName("user").setDescription("The user to warn").setRequired(true);
        })
        .addStringOption((option) => {
          return option
            .setName("reason")
            .setDescription("The reason for the warn")
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(500);
        }),
    )
    .addSubcommand((subCmd) =>
      subCmd
        .setName("remove")
        .setDescription("Remove a warn from a user")
        .addStringOption((option) => {
          return option
            .setName("warn_id")
            .setDescription("The id of the warn to remove")
            .setRequired(true);
        }),
    ),
  async (client, interaction) => {
    switch (interaction.options.getSubcommand()) {
      case "add":
        {
          const { options, guild, member } = interaction;
          const user = options.getUser("user");
          const reason = options.getString("reason") || "Not provided reason the warn";
          const warnTime = time();

          if (!guild || !member || !user)
            return interaction.reply({
              embeds: [
                new ErrorEmbed().setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string, "error")} Warn Error Options`,
                    `Check the data entered and where you are executing the command`,
                  ].join("\n"),
                ),
              ],
            });

          await main.prisma.userWarn.create({
            data: {
              guildId: guild.id,
              userId: user.id,
              warnReason: reason,
              moderator: member.user.id,
              warnDate: warnTime,
            },
          });

          await interaction.reply({
            embeds: [
              new EmbedCorrect()
                .setTitle("User warned!")
                .setDescription(`<@${user.id}> has been warned for \`${reason}\`!`),
            ],
            flags: "Ephemeral",
          });

          const modData = await main.prisma.serverModlog.findFirst({
            where: { guildId: guild.id },
          });
          const data = await main.prisma.userWarn.findFirst({
            where: {
              guildId: guild.id,
              userId: user.id,
            },
          });

          if (modData) {
            const channel = client.channels.cache.get(modData.channelId) as TextChannel;
            channel.send({
              embeds: [
                new EmbedCorrect().setTitle("New user warned").addFields(
                  {
                    name: "User warned",
                    value: `<@${user.id}>`,
                    inline: true,
                  },
                  {
                    name: "Warned by",
                    value: `<@${member.user.id}>`,
                    inline: true,
                  },
                  {
                    name: "Warned at",
                    value: `${warnTime}`,
                    inline: true,
                  },
                  {
                    name: "Warn ID",
                    value: `\`${data?.id ? data.id : "Not ID"}\``,
                    inline: true,
                  },
                  {
                    name: "Warn Reason",
                    value: `\`\`\`${reason}\`\`\``,
                  },
                ),
              ],
            });
          }

          user
            .send({
              embeds: [
                new EmbedCorrect()
                  .setTitle(`You have been warned in: ${guild.name}`)
                  .addFields(
                    {
                      name: "Warned for",
                      value: `\`${reason}\``,
                      inline: true,
                    },
                    {
                      name: "Warned at",
                      value: `${warnTime}`,
                      inline: true,
                    },
                  )
                  .setColor("#2f3136"),
              ],
            })
            .catch(async () => {
              await interaction.followUp({
                embeds: [
                  new ErrorEmbed()
                    .setTitle("DM Notification Failed")
                    .setDescription("The user has DMs disabled, so no notification was sent."),
                ],
                flags: "Ephemeral",
              });
            });
        }
        break;

      case "remove": {
        const warnId = interaction.options.getString("warn_id");
        if (!warnId)
          return interaction.reply({
            embeds: [
              new ErrorEmbed().setDescription(
                [
                  `${client.getEmoji(interaction.guildId as string, "error")} Warn Error Options`,
                  `Check the data entered and where you are executing the command`,
                ].join("\n"),
              ),
            ],
          });

        const data = await main.prisma.userWarn.findUnique({ where: { id: warnId } });

        const err = new EmbedCorrect().setDescription(
          `No warn Id watching \`${warnId}\` was found!`,
        );

        if (!data) return await interaction.reply({ embeds: [err] });

        await main.prisma.userWarn.delete({ where: { id: warnId } });

        const embed = new EmbedCorrect()
          .setTitle("Remove Infraction")
          .setDescription(`Successfully removed the warn with the ID matching ${warnId}`);
        return await interaction.reply({ embeds: [embed] });
      }
    }

    return;
  },
);
