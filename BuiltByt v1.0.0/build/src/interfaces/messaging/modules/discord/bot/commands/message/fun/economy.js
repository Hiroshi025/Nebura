"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="9d95c34e-8576-5c74-9236-ec26182966d7")}catch(e){}}();

const daily_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/daily");
const inventory_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/inventory");
const rob_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/rob");
const economyCommand = {
    name: "economy",
    description: "economy commaands for the bot",
    examples: ["economy <text>"],
    nsfw: false,
    owner: false,
    cooldown: 30,
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
                    await inventory_1.InventoryCommand.Message(message, client, args);
                }
                break;
            case "rob":
                {
                    await rob_1.RobCommand.Message(message, client, args);
                }
                break;
            case "daily":
                {
                    await daily_1.DailyCommand.Message(message, client, args);
                }
                break;
        }
    },
};
module.exports = economyCommand;
//# sourceMappingURL=economy.js.map
//# debugId=9d95c34e-8576-5c74-9236-ec26182966d7
