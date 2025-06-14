import { Event } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { client, main } from "@/main";
import { logWithLabel } from "@/shared/utils/functions/console";

export default new Event("debug", async (info) => {
  if (!client.user) return;
  const data = await main.prisma.myDiscord.findUnique({ where: { clientId: client.user.id } });
  if (!data || data.logconsole === false) return;

  logWithLabel("custom", info, {
    customLabel: "Discord"
  });
});
