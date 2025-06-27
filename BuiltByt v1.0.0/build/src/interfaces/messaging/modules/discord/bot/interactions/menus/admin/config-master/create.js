"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="5e9b9d4b-e26f-58c4-808f-c608e80e48a8")}catch(e){}}();

const main_1 = require("../../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../../shared/adapters/extends/embeds.extend");
const menuName = {
    id: "select-webhook-channel",
    maintenance: false,
    tickets: false,
    owner: true,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        if (!interaction.guild || !interaction.channel || !interaction.member)
            return;
        const i = interaction;
        await i.deferUpdate(); // Deferir la interacción para poder editar luego
        const channel = i.values[0];
        const guild = await client.guilds.fetch(interaction.guildId);
        const channelData = (await guild.channels.fetch(channel));
        if (!channelData) {
            await i.followUp({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setTitle("Error")
                        .setDescription(`${client.getEmoji(interaction.guildId, "error")} **Error**\n` +
                        `The selected channel does not exist or is not a text channel.`),
                ],
                flags: "Ephemeral",
            });
            return; // Termina aquí para evitar doble respuesta
        }
        await new Promise((res) => setTimeout(res, 1000));
        const webhook = await channelData.createWebhook({
            name: "Error Logs",
            avatar: client.user?.displayAvatarURL(),
        });
        await main_1.main.prisma.discord.update({
            where: { clientId: client.user?.id },
            data: { webhookURL: webhook.url },
        });
        await new Promise((res) => setTimeout(res, 1000));
        await i.editReply({
            embeds: [
                new embeds_extend_1.EmbedCorrect()
                    .setTitle("Configuration")
                    .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                    `The webhook has been created in <#${channel}>`),
            ],
            components: [],
        });
    },
};
module.exports = menuName;
//# sourceMappingURL=create.js.map
//# debugId=5e9b9d4b-e26f-58c4-808f-c608e80e48a8
