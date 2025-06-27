"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="00a6fc83-697b-58ab-b872-6fb7f577b51e")}catch(e){}}();

const discord_js_1 = require("discord.js");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const invCommand = {
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
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const inviteURL = client.generateInvite({
            scopes: [discord_js_1.OAuth2Scopes.Bot, discord_js_1.OAuth2Scopes.ApplicationsCommands],
            permissions: [discord_js_1.PermissionFlagsBits.Administrator, discord_js_1.PermissionFlagsBits.ManageGuildExpressions],
        });
        const embed = new embeds_extend_1.EmbedCorrect().setTitle("Invite Me").setDescription(`[Click here](${inviteURL})`);
        const button = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setStyle(discord_js_1.ButtonStyle.Link).setLabel("Invite Me").setURL(inviteURL));
        return message.channel.send({ embeds: [embed], components: [button] });
    },
};
module.exports = invCommand;
//# sourceMappingURL=invite.js.map
//# debugId=00a6fc83-697b-58ab-b872-6fb7f577b51e
