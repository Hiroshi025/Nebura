import { ChannelType } from "discord.js";

import {
	createCollectors, createComponents, createMainEmbed, createStatsEmbed
} from "@/modules/discord/structure/utils/functions";
import { Precommand } from "@typings/modules/discord";

const commandServerInfo: Precommand = {
  name: "serverinfo",
  description: "Get detailed information about the server",
  examples: ["serverinfo"],
  nsfw: false,
  owner: false,
  aliases: ["server", "guildinfo"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(_client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    const guild = message.guild;
    await guild.fetch(); // Asegurarnos de tener datos actualizados

    // Embed principal
    const mainEmbed = await createMainEmbed(guild);

    // Embed de estadísticas
    const statsEmbed = await createStatsEmbed(guild);

    // Componentes interactivos
    const components = await createComponents();

    // Enviar mensaje
    const msg = await message.reply({
      embeds: [mainEmbed, statsEmbed],
      components: [components.buttons, components.selectMenu],
    });

    // Colector de interacciones
    await createCollectors(msg, guild);
  },
};

export = commandServerInfo;
