import {
	handleTaxButton
} from "@/interfaces/messaging/modules/discord/structure/utils/economy/work";
import { Buttons } from "@typings/modules/discord";

const pay_taxButton: Buttons = {
  id: "pay_tax",
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction) {
    if (!interaction.guild || !interaction.channel) return;
    await handleTaxButton(interaction);
    return;
  },
};

export default pay_taxButton;
