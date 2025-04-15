import { client, main } from "@/main";
import { Event } from "@/modules/discord/structure/utils/builders";
import { logWithLabel } from "@/shared/utils/functions/console";

export default new Event("debug", async (info) => {
  if (!client.user) return;
  const data = await main.prisma.appDiscord.findUnique({ where: { clientId: client.user.id } });
  if (!data || data.logconsole === false) return;

  logWithLabel("debug", info);
});