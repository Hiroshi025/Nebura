"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="bbcd8557-c12f-57fa-8133-002e9250230a")}catch(e){}}();

const main_1 = require("../../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../../shared/adapters/extends/embeds.extend");
const DB_1 = require("../../../../../../../../../shared/class/DB");
const deleteWebhookConfig = {
    id: "button-delete-webhook-config",
    tickets: false,
    owner: true,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel)
            return;
        const i = interaction;
        await i
            .update({
            embeds: [
                new embeds_extend_1.EmbedCorrect()
                    .setTitle("Configuration")
                    .setDescription([
                    `${client.getEmoji(interaction.guildId, "correct")} **Configuration**`,
                    `The webhook URL has been successfully removed, please check \`/config\` again.`,
                ].join("\n")),
            ],
            components: [],
        })
            .then(async () => {
            await main_1.main.prisma.discord.update({
                where: { clientId: DB_1.clientID },
                data: { webhookURL: null },
            });
        });
    },
};
module.exports = deleteWebhookConfig;
//# sourceMappingURL=delete.js.map
//# debugId=bbcd8557-c12f-57fa-8133-002e9250230a
