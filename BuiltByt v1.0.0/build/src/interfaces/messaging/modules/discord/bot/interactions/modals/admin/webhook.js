"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="f3355c2d-a127-5123-8226-be967feecae2")}catch(e){}}();

const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const modalWebhook = {
    id: "modal-webhook-config",
    tickets: false,
    owner: false,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        const input = interaction.fields.getTextInputValue("input-webhook-url");
        if (!interaction.guild || !interaction.channel || !client.user)
            return;
        const data = await main_1.main.DB.findDiscord(client.user.id);
        if (!data)
            return interaction.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setTitle("Error Configuration")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} **Error**`,
                        `No configuration found for this server.`,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        await main_1.main.prisma.discord.update({
            where: {
                clientId: client.user?.id,
            },
            data: {
                webhookURL: input,
            },
        });
        return await interaction.reply({
            embeds: [
                new embeds_extend_1.EmbedCorrect()
                    .setTitle("Webhook Configuration")
                    .setDescription([
                    `${client.getEmoji(interaction.guild.id, "correct")} **Success**`,
                    `The webhook URL has been set to: \`${input}\``,
                ].join("\n")),
            ],
            flags: "Ephemeral",
        });
    },
};
module.exports = modalWebhook;
//# sourceMappingURL=webhook.js.map
//# debugId=f3355c2d-a127-5123-8226-be967feecae2
