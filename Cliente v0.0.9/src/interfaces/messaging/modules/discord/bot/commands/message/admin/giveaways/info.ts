// src/commands/giveaway/info.ts
import { EmbedBuilder } from "discord.js";

import { GiveawayManager } from "@/main";
import { Precommand } from "@typings/modules/discord";
import { ErrorEmbed } from "@utils/extends/embeds.extension";

const GiveawayInfo: Precommand = {
  name: "giveaway-info",
  description: "Get information about a giveaway",
  examples: ["/giveaway info"],
  nsfw: false,
  owner: false,
  permissions: [],
  botpermissions: ["SendMessages", "EmbedLinks"],
  async execute(_client, message) {
    if (!message.guild) return;

    const giveaways = await GiveawayManager.getManager().giveaways.filter(
      (g: { guildId: string; ended: any; }) => g.guildId === message.guild?.id && !g.ended,
    );

    if (giveaways.length === 0) {
      return message.reply({
        embeds: [new ErrorEmbed().setDescription("There are no active giveaways in this server!")],
        flags: "SuppressNotifications",
      });
    }

    const giveaway = giveaways[0]; // For simplicity, showing the first active giveaway
    // In a real implementation, you might want to let users select which giveaway to view

    const embed = new EmbedBuilder()
      .setTitle(`🎉 Giveaway: ${giveaway.prize}`)
      .setDescription(
        `**Hosted by:** ${giveaway.hostedBy}\n` +
          `**Winners:** ${giveaway.winnerCount}\n` +
          `**Ends in:** ${giveaway.remainingTime}\n` +
          //`**Participants:** ${giveaway.u ? giveaway.participants.length : 0}\n` +
          `[Jump to Giveaway](${giveaway.messageURL})`,
      )
      .setColor("#FFD700")
      .setFooter({ text: `Giveaway ID: ${giveaway.messageId}` })
      .setTimestamp(giveaway.endAt);

    return await message.reply({ embeds: [embed] });
  },
};

export = GiveawayInfo;
