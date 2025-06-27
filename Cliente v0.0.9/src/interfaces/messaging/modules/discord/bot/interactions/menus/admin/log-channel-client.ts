import { main } from "@/main";
import { Menus } from "@typings/modules/discord";
import { EmbedCorrect } from "@utils/extenders/embeds.extend";

const logChannelClient: Menus = {
  id: "select-log-channel",
  maintenance: false,
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const channelId = interaction.values[0];
    await main.prisma.discord.update({
      where: { clientId: client.user?.id as string },
      data: { logchannel: channelId },
    });
    await interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle("Configuration")
          .setDescription(
            `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
              `The log channel has been successfully set to <#${channelId}>.`,
          ),
      ],
      components: [],
    });
  },
};

export = logChannelClient;
