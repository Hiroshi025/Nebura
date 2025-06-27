"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="3754b8be-764f-5d75-a79a-b8aec671c967")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/* eslint-disable @typescript-eslint/no-explicit-any */
const discord_js_1 = require("discord.js");
const http_1 = require("http");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const emojis_json_1 = __importDefault(require("../../../../../../../../../config/json/emojis.json"));
const httpCommand = {
    name: "https",
    description: "Show httpstatus with a meme image and description",
    examples: ["httpsstatus [status]", "httpsstatus [params] 200"],
    nsfw: false,
    owner: false,
    cooldown: 5,
    aliases: ["httpstatuscode", "httpstatuscodes", "httpstatuscodes", "httpstatuscode"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(client, message, args, prefix) {
        try {
            if (!message.guild)
                return;
            const status = args[0];
            if (!status)
                return message.reply({
                    embeds: [
                        new discord_js_1.EmbedBuilder()
                            .setColor("Red")
                            .setFooter({
                            text: `Requested by: ${message.author.tag}`,
                            iconURL: client.user?.displayAvatarURL(),
                        })
                            .setDescription([
                            `${emojis_json_1.default.error} You did not provide a status code to lookup for a meme!`,
                            `Usage: \`${prefix}httpstatus <status>\``,
                        ].join("\n")),
                    ],
                });
            if (status !== "599" && !http_1.STATUS_CODES[status])
                return message.reply({
                    content: [
                        `${emojis_json_1.default.error} The status code is invalid or not provided (100-599) or (599)`,
                        `Usage: \`${prefix}httpstatus <status>\``,
                    ].join("\n"),
                });
            return message.reply({
                content: `https://http.cat/${status}.jpg`,
            });
        }
        catch (e) {
            return message.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setFooter({
                        text: `Requested by: ${message.author.tag}`,
                        iconURL: message.author.displayAvatarURL(),
                    })
                        .setDescription([
                        `${emojis_json_1.default.error} An error occurred while executing this command!`,
                        `please try again later or join our support server for help!`,
                    ].join("\n"))
                        .setErrorFormat(e.stack),
                ],
            });
        }
    },
};
module.exports = httpCommand;
//# sourceMappingURL=http.js.map
//# debugId=3754b8be-764f-5d75-a79a-b8aec671c967
