import { DailyCommand } from "@/interfaces/messaging/modules/discord/structure/utils/economy/daily";
import {
	InventoryCommand
} from "@/interfaces/messaging/modules/discord/structure/utils/economy/inventory";
import { RobCommand } from "@/interfaces/messaging/modules/discord/structure/utils/economy/rob";
import { Precommand } from "@typings/modules/discord";

const economyCommand: Precommand = {
  name: "economy",
  description: "economy commaands for the bot",
  examples: ["economy <text>"],
  nsfw: false,
  owner: false,
  cooldown: 30,
  category: "Entertainment",
  aliases: ["eco"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  subcommands: [
    "economy balance <user>: Get the balance of a user",
    "economy inventory view <page>: View the inventory of a user",
    "economy inventory use_item <identifier>: Use an item from your inventory",
    "economy rob <user>: Rob a user",
  ],
  async execute(client, message, args) {
    const subcommand = args[0];
    switch (subcommand) {
      case "inventory":
        {
          await InventoryCommand.Message(message, client, args);
        }
        break;
      case "rob":
        {
          await RobCommand.Message(message, client, args);
        }
        break;
      case "daily":
        {
          await DailyCommand.Message(message, client, args);
        }
        break;
    }
  },
};

export = economyCommand;
