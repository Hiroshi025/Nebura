import { ActivityType } from "discord.js";

import { client } from "@/main";
import { Event } from "@/modules/discord/structure/utils/builders";

export default new Event("ready", async () => {
  if (!client.user) return;
  client.user.setActivity({
    name: "Nebura AI Client",
    state: "idle",
    url: "https://help.hiroshi-dev.me",
    type: ActivityType.Streaming,
  });
});
