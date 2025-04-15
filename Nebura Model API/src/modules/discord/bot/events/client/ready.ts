import { ActivityType } from "discord.js";

import { client } from "@/main";
import { Event } from "@/modules/discord/structure/utils/builders";

import _package from "../../../../../../package.json";

export default new Event("ready", async () => {
  if (!client.user) return;
  client.user.setActivity({
    name: `Asistent ${_package.version} - ${client.ws.ping}ms`,
    type: ActivityType.Competing,
  });
});
