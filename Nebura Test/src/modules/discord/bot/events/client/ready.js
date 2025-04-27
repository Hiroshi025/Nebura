"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../../../../../main");
const eventlistener_1 = require("../../../../../modules/discord/structure/handlers/eventlistener");
const builders_1 = require("../../../../../modules/discord/structure/utils/builders");
/**
 * Represents the "ready" event for the Discord bot.
 * This event is triggered when the bot successfully logs in and is ready to operate.
 */
exports.default = new builders_1.Event("ready", async () => {
    // Ensure the bot's user is available before proceeding.
    if (!main_1.client.user)
        return;
    /**
     * Fetches guild data from the database where the bot is registered.
     * The query retrieves the guild ID and event log settings.
     */
    const data = await main_1.main.prisma.myGuild.findMany({
        where: { discordId: main_1.client.user.id },
        select: {
            guildId: true,
            eventlogs: {
                select: {
                    enabled: true,
                },
            },
        },
    });
    /**
     * An array to store the guilds that the bot is a part of and are cached.
     */
    let guilds = [];
    // Iterate through the fetched guild data and add the corresponding cached guilds to the array.
    for (const guild of data) {
        const guildData = main_1.client.guilds.cache.get(guild.guildId);
        if (guildData) {
            guilds.push(guildData);
        }
    }
    // If no guilds are found, exit the function.
    if (guilds.length === 0)
        return;
    /**
     * Initializes a logger instance for the bot with the retrieved guilds.
     * Enables logging functionality for the bot.
     */
    const logger = await new eventlistener_1.LogClass(main_1.client, guilds);
    await logger.enabled(true);
});
