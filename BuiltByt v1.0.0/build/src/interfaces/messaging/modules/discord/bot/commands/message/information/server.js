"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="0fdd588f-e8eb-507d-b02b-feb51f3539d9")}catch(e){}}();

const discord_js_1 = require("discord.js");
const functions_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/functions");
const commandServerInfo = {
    name: "serverinfo",
    description: "Get detailed information about the server",
    examples: ["serverinfo"],
    nsfw: false,
    owner: false,
    aliases: ["server", "guildinfo"],
    botpermissions: ["SendMessages", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(_client, message) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const guild = message.guild;
        await guild.fetch(); // Asegurarnos de tener datos actualizados
        // Embed principal
        const mainEmbed = await (0, functions_1.createMainEmbed)(guild);
        // Embed de estadísticas
        const statsEmbed = await (0, functions_1.createStatsEmbed)(guild);
        // Componentes interactivos
        const components = await (0, functions_1.createComponents)();
        // Enviar mensaje
        const msg = await message.reply({
            embeds: [mainEmbed, statsEmbed],
            components: [components.buttons, components.selectMenu],
        });
        // Colector de interacciones
        await (0, functions_1.createCollectors)(msg, guild);
    },
};
module.exports = commandServerInfo;
//# sourceMappingURL=server.js.map
//# debugId=0fdd588f-e8eb-507d-b02b-feb51f3539d9
