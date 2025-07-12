import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, OAuth2Scopes, PermissionFlagsBits
} from "discord.js";

import { EmbedCorrect } from "@shared/utils/extends/discord/embeds.extends";
import { Precommand } from "@typings/modules/discord";

const invCommand: Precommand = {
  name: "invite",
  nameLocalizations: {
    "es-ES": "invitar",
    "en-US": "invite",
  },
  description: "Sends the invite link of the bot",
  descriptionLocalizations: {
    "es-ES": "Envía el enlace de invitación del bot",
    "en-US": "Sends the invite link of the bot",
  },
  examples: ["invite"],
  nsfw: false,
  category: "Information",
  owner: false,
  cooldown: 50,
  aliases: ["inv"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const lang = message.guild.preferredLocale || "en-US";
    const inviteURL = client.generateInvite({
      scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
      permissions: [PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuildExpressions],
    });
    const embed = new EmbedCorrect()
      .setTitle(client.t("discord:invite.title", { lng: lang }))
      .setDescription(client.t("discord:invite.desc", { url: inviteURL, lng: lang }));

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(client.t("discord:invite.button", { lng: lang }))
        .setURL(inviteURL),
    );

    return message.channel.send({ embeds: [embed], components: [button] });
  },
};

export default invCommand;
