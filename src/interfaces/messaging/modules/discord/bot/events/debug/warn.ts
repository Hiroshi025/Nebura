import { createEvent } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { client, main } from "@/main";
import { logWithLabel } from "@/shared/utils/functions/console";

export default createEvent({
  data: { name: "warn" },
  async run(info) {
    if (!client.user) return;
    const data = await main.DB.findDiscord(client.user.id);
    if (!data || data.logconsole === false) return;

    logWithLabel("custom", info, {
      customLabel: "Discord",
    });
  },
});
