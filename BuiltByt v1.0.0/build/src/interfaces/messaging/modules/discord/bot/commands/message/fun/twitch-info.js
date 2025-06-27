"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="81c7fe77-2a96-5866-8b79-b1b23c7a0d95")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const twitchInfo = {
    name: "twitch-info",
    description: "Provides information on Twitch profile accounts",
    examples: ["twitch-info <username>"],
    nsfw: false,
    owner: false,
    aliases: ["twitch", "twitchinfo", "twitchprofile"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(client, message, args) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const user = args[0];
        if (!user) {
            return message.channel.send({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setTitle("Error Command Twitch")
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "error")} The **username** argument is required.`,
                        `Please provide a valid Twitch username.`,
                    ].join("\n")),
                ],
            });
        }
        try {
            const Response = await axios_1.default.get(`https://api.crunchprank.net/twitch/followcount/${user.toLowerCase()}`);
            const upTime = await axios_1.default.get(`https://api.crunchprank.net/twitch/uptime/${user.toLowerCase()}`);
            const totalViews = await axios_1.default.get(`https://api.crunchprank.net/twitch/total_views/${user.toLowerCase()}`);
            const accountage = await axios_1.default.get(`https://api.crunchprank.net/twitch/creation/${user.toLowerCase()}`);
            const lastGame = await axios_1.default.get(`https://api.crunchprank.net/twitch/game/${user.toLowerCase()}`);
            const avatarimg = await axios_1.default.get(`https://api.crunchprank.net/twitch/avatar/${user.toLowerCase()}`);
            if (upTime.data === `${user} is offline`) {
                upTime.data = "esta Offline";
            }
            const embed = new embeds_extend_1.EmbedCorrect()
                .setColor("#e100ff")
                .setTitle(`Twitch stats de: ${user}`)
                .setDescription(`❣️ **Followers**: ${Response.data} \n
            👀 **Views**: ${totalViews.data}\n 
            ⬆ **Uptime**: ${upTime.data} \n
            📝 **Creado el**: ${accountage.data}  \n
            ⏮️ **Ultimo juego**: ${lastGame.data} \n
            🔴 **En directo**: ${upTime.data}`)
                .setFooter({
                text: `Informacion requerida por: ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL(),
            })
                .setURL(`https://twitch.tv/${user}`)
                .setThumbnail("https://pngimg.com/uploads/twitch/twitch_PNG27.png")
                .setImage(`${avatarimg.data}`)
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
        catch (err) {
            return message.channel.send({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setTitle("Error Command Twitch")
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "error")} An error occurred while fetching Twitch information.`,
                        `Please try again later.`,
                    ].join("\n")),
                ],
            });
        }
    },
};
module.exports = twitchInfo;
//# sourceMappingURL=twitch-info.js.map
//# debugId=81c7fe77-2a96-5866-8b79-b1b23c7a0d95
