import { Event } from "@/modules/discord/structure/utils/builders";
import { logWithLabel } from "@/shared/utils/functions/console";

export default new Event("warn", async (info) => {
  logWithLabel("custom", info, "Warn");
});
