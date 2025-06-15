import { ActivityType } from "discord.js";

import { Event } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { client, main } from "@/main";
import { clientID } from "@/shared/DB";

/**
 * Represents the "ready" event for the Discord bot.
 * This event is triggered when the bot successfully logs in and is ready to operate.
 */
export default new Event("ready", async () => {
  // Ensure the bot's user is available before proceeding.
  if (!client.user) return;

  const data = await main.DB.findClient(clientID);

  if (!data || !data.modules?.discord || !data.modules?.discord?.activity) return;
  const activity = data.modules.discord.activity;
  /**
   * An array to store the guilds that the bot is a part of and are cached.
   */
  client.user.setActivity({
    name: activity.name || "Nebura AI Client",
    state: activity.status || "idle",
    url: activity.url || "https://help.hiroshi-dev.me",
    type: ActivityType.Streaming,
  });
});
