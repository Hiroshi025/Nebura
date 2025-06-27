"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="e07b9e5f-c6fa-50b1-84e3-235e3325efd3")}catch(e){}}();

const work_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/economy/work");
const pay_taxButton = {
    id: "pay_tax",
    tickets: false,
    owner: false,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction) {
        if (!interaction.guild || !interaction.channel)
            return;
        await (0, work_1.handleTaxButton)(interaction);
        return;
    },
};
module.exports = pay_taxButton;
//# sourceMappingURL=expenses.js.map
//# debugId=e07b9e5f-c6fa-50b1-84e3-235e3325efd3
