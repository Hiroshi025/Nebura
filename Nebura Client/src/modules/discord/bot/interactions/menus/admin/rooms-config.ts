import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";
import { Menus } from "@typings/modules/discord";
import { config } from "@utils/config";

const setMenuRoom: Menus = {
  id: "rooms:menu-config",
  tickets: false,
  cooldown: 10,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel)
      return interaction.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error Rooms - Systems")
            .setDescription(
              [
                `${client.getEmoji(
                  interaction.guild.id,
                  "error",
                )} An error occurred while trying to set the rooms system.`,
                `Please try again later or contact the support team.`,
              ].join("\n"),
            ),
        ],
        ephemeral: true,
      });

    await main.prisma.myGuild.update({
      where: { id: interaction.guild.id },
      data: {
        rooms: channelId,
      },
    });

    interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle("Rooms System - Enabled")
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id, "correct")} The rooms system has been enabled successfully.`,
              `**Channel:** <#${channelId}>`,
              `**Usage:**`,
              `• \`${config.modules.discord.prefix}rooms disabled\``,
              `• \`${config.modules.discord.prefix}rooms enabled <channel_id>\``,
            ].join("\n"),
          ),
      ],
      ephemeral: true,
    });

    return;
  },
};
export = setMenuRoom;
