import { ActivityType, Guild } from "discord.js";

import { LogClass } from "@/interfaces/messaging/modules/discord/structure/handlers/eventlistener";
import { Event } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { client, main } from "@/main";

/**
 * Represents the "ready" event for the Discord bot.
 * This event is triggered when the bot successfully logs in and is ready to operate.
 */
export default new Event("ready", async () => {
  // Ensure the bot's user is available before proceeding.
  if (!client.user) return;

  /**
   * Fetches guild data from the database where the bot is registered.
   * The query retrieves the guild ID and event log settings.
   */
  const data = await main.prisma.myGuild.findMany({
    where: { discordId: client.user.id },
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
  let guilds: Guild[] = [];

  // Iterate through the fetched guild data and add the corresponding cached guilds to the array.
  for (const guild of data) {
    const guildData = client.guilds.cache.get(guild.guildId);
    if (guildData) {
      guilds.push(guildData);
    }
  }

  // If no guilds are found, exit the function.
  if (guilds.length === 0) return;

  /**
   * Initializes a logger instance for the bot with the retrieved guilds.
   * Enables logging functionality for the bot.
   */
  const logger = await new LogClass(client, guilds);
  await logger.enabled(true);
  client.user.setActivity({
    name: "Nebura AI Client",
    state: "idle",
    url: "https://help.hiroshi-dev.me",
    type: ActivityType.Streaming,
  });
});
