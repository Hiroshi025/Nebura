"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../main");
const builders_1 = require("../../../../../modules/discord/structure/utils/builders");
exports.default = new builders_1.Event("ready", async () => {
    if (!main_1.client.user)
        return;
    main_1.client.user.setActivity({
        name: "Nebura AI Client",
        state: "idle",
        url: "https://help.hiroshi-dev.me",
        type: discord_js_1.ActivityType.Streaming,
    });
});
