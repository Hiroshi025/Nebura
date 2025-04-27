import "moment/locale/es";

import { ChannelType, GuildMember } from "discord.js";
import moment from "moment";

import {
	createCollectorsv2, createComponentsv2, createMainEmbedv2, createStatusEmbed, getTargetUserv2
} from "@/modules/discord/structure/utils/functions";
import { Precommand } from "@typings/modules/discord";

moment.locale("es");

const commandUserInfo: Precommand = {
  name: "userinfo",
  description: "The command to get information about a user.",
  examples: ["userinfo @usuario", "userinfo 123456789012345678"],
  nsfw: false,
  owner: false,
  aliases: ["user", "usuario", "uinfo"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(client, message, args) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;

    // Obtener el usuario objetivo
    const targetUser = await await getTargetUserv2(message, args);
    if (!targetUser)
      return message.reply({
        embeds: [
          {
            title: "Error User Info",
            description: [
              `${client.getEmoji(message.guild.id, "error")} The user was not found.`,
              `Please mention a user or provide their ID.`,
            ].join("\n"),
          },
        ],
      });

    // Obtener el miembro de la guild (si está presente)
    let targetMember: GuildMember | undefined;
    try {
      targetMember = await message.guild.members.fetch(targetUser.id);
    } catch {
      targetMember = undefined;
    }

    // Crear embeds principales
    const mainEmbed = await createMainEmbedv2(targetUser, targetMember);
    const statusEmbed = await createStatusEmbed(targetUser, targetMember);

    // Componentes interactivos
    const components = await createComponentsv2(targetUser, targetMember);

    // Enviar mensaje
    const msg = await message.reply({
      embeds: [mainEmbed, statusEmbed],
      components: [components.buttons, components.selectMenu],
    });

    // Colector de interacciones
    await createCollectorsv2(msg, targetUser, targetMember);
    return;
  },
};

export = commandUserInfo;
