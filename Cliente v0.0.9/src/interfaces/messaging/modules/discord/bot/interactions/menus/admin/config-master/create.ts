import { TextChannel } from "discord.js";

import { main } from "@/main";
import { Menus } from "@typings/modules/discord";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

const menuName: Menus = {
  id: "select-webhook-channel",
  maintenance: false,
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const i = interaction;

    await i.deferUpdate(); // Deferir la interacción para poder editar luego

    const channel = i.values[0];
    const guild = await client.guilds.fetch(interaction.guildId as string);
    const channelData: TextChannel = (await guild.channels.fetch(channel)) as TextChannel;
    if (!channelData) {
      await i.followUp({
        embeds: [
          new ErrorEmbed()
            .setTitle("Error")
            .setDescription(
              `${client.getEmoji(interaction.guildId as string, "error")} **Error**\n` +
                `The selected channel does not exist or is not a text channel.`,
            ),
        ],
        flags: "Ephemeral",
      });
      return; // Termina aquí para evitar doble respuesta
    }

    await new Promise((res) => setTimeout(res, 1000));
    const webhook = await channelData.createWebhook({
      name: "Error Logs",
      avatar: client.user?.displayAvatarURL(),
    });
    await main.prisma.discord.update({
      where: { clientId: client.user?.id as string },
      data: { webhookURL: webhook.url },
    });
    await new Promise((res) => setTimeout(res, 1000));
    await i.editReply({
      embeds: [
        new EmbedCorrect()
          .setTitle("Configuration")
          .setDescription(
            `${client.getEmoji(interaction.guildId as string, "correct")} **Configuration**\n` +
              `The webhook has been created in <#${channel}>`,
          ),
      ],
      components: [],
    });
  },
};

export = menuName;
