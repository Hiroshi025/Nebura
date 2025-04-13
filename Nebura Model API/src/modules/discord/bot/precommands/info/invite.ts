import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  OAuth2Scopes,
  PermissionFlagsBits,
} from "discord.js";

import { EmbedInfo } from "@/structure/extenders/discord/embeds.extender";
import { Precommand } from "@/typings/discord";

const invCommand: Precommand = {
  name: "invite",
  description: "Sends the invite link of the bot",
  examples: ["invite"],
  nsfw: false,
  owner: false,
  cooldown: 50,
  aliases: ["inv"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText)
      return;
    const inviteURL = client.generateInvite({
      scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
      permissions: [PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuildExpressions],
    });
    const embed = new EmbedInfo()
      .setTitle("Invite Me")
      .setDescription(`[Click here](${inviteURL})`);

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Invite Me").setURL(inviteURL),
    );

    return message.channel.send({ embeds: [embed], components: [button] });
  },
};

export = invCommand;
