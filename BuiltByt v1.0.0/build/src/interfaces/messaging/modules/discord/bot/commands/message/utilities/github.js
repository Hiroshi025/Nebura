"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="0bc123fb-85b5-5452-955a-ef2d05937036")}catch(e){}}();

const discord_js_1 = require("discord.js");
const functions_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/functions");
const commandGithub = {
    name: "github",
    description: "Search GitHub profiles and repositories",
    examples: [
        "github <username> - Search for a GitHub user",
        "github <username>/<repo> - Search for a specific repository",
        "github search <query> - Search for repositories",
    ],
    nsfw: false,
    owner: false,
    aliases: ["gh", "git"],
    botpermissions: ["SendMessages", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(_client, message, args) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        if (!args[0]) {
            return message.reply("Please provide a GitHub username, repository (user/repo), or search query. Example: `github octocat` or `github octocat/Hello-World`");
        }
        // Check if it's a repository (contains /)
        if (args[0].includes("/") && args.length === 1) {
            return await (0, functions_1.handleRepository)(message, args[0]);
        }
        // Check if it's a search
        if (args[0].toLowerCase() === "search") {
            const query = args.slice(1).join(" ");
            return await (0, functions_1.handleSearch)(message, query);
        }
        // Otherwise treat as username
        return await (0, functions_1.handleUser)(message, args[0]);
    },
};
module.exports = commandGithub;
//# sourceMappingURL=github.js.map
//# debugId=0bc123fb-85b5-5452-955a-ef2d05937036
