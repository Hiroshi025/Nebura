import { DailyCommand } from "@/interfaces/messaging/modules/discord/structure/utils/economy/daily";
import {
	InventoryCommand
} from "@/interfaces/messaging/modules/discord/structure/utils/economy/inventory";
import { RobCommand } from "@/interfaces/messaging/modules/discord/structure/utils/economy/rob";
import { Precommand } from "@typings/modules/discord";

const economyCommand: Precommand = {
  name: "economy",
  nameLocalizations: {
    "es-ES": "economía",
    "en-US": "economy",
  },
  description: "economy commaands for the bot",
  descriptionLocalizations: {
    "es-ES": "comandos de economía para el bot",
    "en-US": "economy commands for the bot",
  },
  usage: "economy <subcommand> [args]",
  examples: ["economy <text>"],
  nsfw: false,
  owner: false,
  cooldown: 30,
  category: "Entertainment",
  aliases: ["eco"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  subcommands: [
    "economy balance <user>",
    "economy inventory view <page>",
    "economy inventory use_item <identifier>",
    "economy rob <user>",
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

export default economyCommand;
