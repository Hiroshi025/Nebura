"use strict";
const main_1 = require("../../../../../../main");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const modalLogsEvents = {
    id: "button-enabled-logevents-modal",
    tickets: true,
    cooldown: 10,
    owner: false,
    permissions: ["SendMessages"],
    botpermissions: ["SendMessages"],
    async execute(interaction, client) {
        const channelId = interaction.fields.getTextInputValue("button-enabled-logevents-channelId");
        const eventsToLog = interaction.fields.getTextInputValue("button-enabled-logevents-events");
        if (!interaction.guild || !interaction.channel)
            return;
        const events = eventsToLog.split(",").map((event) => event.trim());
        const data = await main_1.main.prisma.myGuild.findUnique({ where: { guildId: interaction.guild.id } });
        if (!data)
            return interaction.reply({
                embeds: [
                    new embeds_extender_1.ErrorEmbed().setTitle("Error - Logs Configuration").setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} 
            **No data found for this server.**`,
                        `Please make sure the bot is set up correctly and try again.`,
                    ].join("\n")),
                ],
            });
        let newEvents = [];
        // a los eventos ya existes añade los nuevos pero que no se repitan los eventos
        if (data.eventlogs && data.eventlogs.events) {
            newEvents = data.eventlogs.events.filter((event) => !events.includes(event));
        }
        await main_1.main.prisma.myGuild.update({
            where: { guildId: interaction.guild.id },
            data: {
                eventlogs: {
                    channelId: channelId,
                    events: newEvents.concat(events),
                    enabled: true,
                },
            },
        });
        await interaction.reply({
            embeds: [
                new embeds_extender_1.EmbedCorrect()
                    .setTitle("Logs Configuration")
                    .setDescription([
                    `${client.getEmoji(interaction.guild.id, "success")} **Logs configuration updated successfully!**`,
                    `**__Data Information_**`,
                    `**Channel ID:** ${channelId}`,
                    `**Events to Log:*`,
                    `\`\`\`json`,
                    `${JSON.stringify(events, null, 2)}`,
                    `\`\`\``,
                    `**Enabled:** true`,
                ].join("\n")),
            ],
        });
        return;
    },
};
module.exports = modalLogsEvents;
