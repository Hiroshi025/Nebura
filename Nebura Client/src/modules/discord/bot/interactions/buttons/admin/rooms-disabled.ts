import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";
import { Buttons } from "@typings/modules/discord";

const setRoomsDisabled: Buttons = {
  id: "rooms:button-disabled",
  tickets: false,
  owner: false,
  cooldown: 10,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const data = await main.prisma.myGuild.findUnique({
      where: { id: interaction.guild.id },
    });
    if (!data)
      return interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Rooms - Systems")
            .setDescription(
              [
                `${client.getEmoji(
                  interaction.guild.id,
                  "error",
                )} An error occurred while trying to disable the rooms system.`,
                `Please try again later or contact the support team.`,
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });

    if (data.rooms === null)
      return interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Rooms - Systems")
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id, "error")} The rooms system is already disabled.`,
                `**Usage:** \`${process.env.PREFIX}rooms enabled <channel_id>\``,
              ].join("\n"),
            ),
        ],
        flags: "Ephemeral",
      });

    await main.prisma.myGuild.update({
      where: { id: interaction.guild.id },
      data: {
        rooms: null,
      },
    });

    interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle("Rooms System - Disabled")
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "correct")} The rooms system has been disabled successfully.`,
              `**Usage:** \`${process.env.PREFIX}rooms enabled <channel_id>\``,
            ].join("\n"),
          ),
      ],
      flags: "Ephemeral",
    });

    return;
  },
};
export = setRoomsDisabled;
