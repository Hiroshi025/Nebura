"use strict";
const main_1 = require("../../../../../../main");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const modalWebhook = {
    id: "modal-webhook-config",
    tickets: true,
    owner: false,
    permissions: ["SendMessages"],
    cooldown: 10,
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        const input = interaction.fields.getTextInputValue("input-webhook-url");
        if (!interaction.guild || !interaction.channel || !client.user)
            return;
        const data = await main_1.main.prisma.myDiscord.findUnique({
            where: {
                clientId: client.user.id,
            },
        });
        if (!data)
            return interaction.reply({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Error Configuration")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} **Error**`,
                        `No configuration found for this server.`,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        await main_1.main.prisma.myDiscord.update({
            where: {
                clientId: client.user.id,
            },
            data: {
                webhookURL: input,
            },
        });
        return await interaction.reply({
            embeds: [
                new embeds_extender_1.EmbedCorrect()
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
