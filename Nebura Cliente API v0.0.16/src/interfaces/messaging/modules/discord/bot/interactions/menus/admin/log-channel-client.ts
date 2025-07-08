import { main } from "@/main";
import { Menus } from "@typings/modules/discord";
import { EmbedCorrect } from "@utils/extends/embeds.extension";

const logChannelClient: Menus = {
  id: "select-log-channel",
  maintenance: false,
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const lang = interaction.locale || interaction.guildLocale || "es-ES";
    const channelId = interaction.values[0];
    await main.prisma.discord.update({
      where: { clientId: client.user?.id as string },
      data: { logchannel: channelId },
    });
    await interaction.reply({
      embeds: [
        new EmbedCorrect()
          .setTitle(client.t("config.logChannelSetTitle", {}, lang))
          .setDescription(
            `${client.getEmoji(interaction.guildId as string, "correct")} ${client.t("config.logChannelSetDesc", { channel: `<#${channelId}>` }, lang)}`,
          ),
      ],
      components: [],
    });
  },
};

export = logChannelClient;
