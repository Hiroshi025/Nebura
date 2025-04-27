"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../../../../../main");
const builders_1 = require("../../../../../modules/discord/structure/utils/builders");
const console_1 = require("../../../../../shared/utils/functions/console");
exports.default = new builders_1.Event("warn", async (info) => {
    if (!main_1.client.user)
        return;
    const data = await main_1.main.prisma.myDiscord.findUnique({ where: { clientId: main_1.client.user.id } });
    if (!data || data.logconsole === false)
        return;
    (0, console_1.logWithLabel)("custom", info, "Warn");
});
