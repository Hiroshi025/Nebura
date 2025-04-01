import { Event } from "@/modules/discord/infrastructure/utils/builders";
import { logWithLabel } from "@/shared/utils/functions/console";

export default new Event("debug", (info) => {
  logWithLabel("success", info);
});
