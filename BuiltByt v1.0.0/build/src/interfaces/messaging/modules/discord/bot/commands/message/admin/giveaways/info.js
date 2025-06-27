"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="33b45f2d-11c5-50a9-9da0-90ee45ba9684")}catch(e){}}();

// src/commands/giveaway/info.ts
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../../shared/adapters/extends/embeds.extend");
const GiveawayInfo = {
    name: "giveaway-info",
    description: "Get information about a giveaway",
    examples: ["/giveaway info"],
    nsfw: false,
    owner: false,
    permissions: [],
    botpermissions: ["SendMessages", "EmbedLinks"],
    async execute(_client, message) {
        if (!message.guild)
            return;
        const giveaways = await main_1.GiveawayManager.getManager().giveaways.filter((g) => g.guildId === message.guild?.id && !g.ended);
        if (giveaways.length === 0) {
            return message.reply({
                embeds: [new embeds_extend_1.ErrorEmbed().setDescription("There are no active giveaways in this server!")],
                flags: "SuppressNotifications",
            });
        }
        const giveaway = giveaways[0]; // For simplicity, showing the first active giveaway
        // In a real implementation, you might want to let users select which giveaway to view
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`🎉 Giveaway: ${giveaway.prize}`)
            .setDescription(`**Hosted by:** ${giveaway.hostedBy}\n` +
            `**Winners:** ${giveaway.winnerCount}\n` +
            `**Ends in:** ${giveaway.remainingTime}\n` +
            //`**Participants:** ${giveaway.u ? giveaway.participants.length : 0}\n` +
            `[Jump to Giveaway](${giveaway.messageURL})`)
            .setColor("#FFD700")
            .setFooter({ text: `Giveaway ID: ${giveaway.messageId}` })
            .setTimestamp(giveaway.endAt);
        return await message.reply({ embeds: [embed] });
    },
};
module.exports = GiveawayInfo;
//# sourceMappingURL=info.js.map
//# debugId=33b45f2d-11c5-50a9-9da0-90ee45ba9684
