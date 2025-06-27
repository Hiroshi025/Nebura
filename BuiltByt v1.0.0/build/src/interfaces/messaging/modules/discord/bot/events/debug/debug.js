"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="a99a29f7-11fa-5afe-8ff3-00ae142d3aeb")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const main_1 = require("../../../../../../../main");
const console_1 = require("../../../../../../../shared/utils/functions/console");
exports.default = new builders_1.Event("debug", async (info) => {
    if (!main_1.client.user)
        return;
    const data = await main_1.main.DB.findDiscord(main_1.client.user.id);
    if (!data || data.logconsole === false)
        return;
    (0, console_1.logWithLabel)("custom", info, {
        customLabel: "Discord",
    });
});
//# sourceMappingURL=debug.js.map
//# debugId=a99a29f7-11fa-5afe-8ff3-00ae142d3aeb
