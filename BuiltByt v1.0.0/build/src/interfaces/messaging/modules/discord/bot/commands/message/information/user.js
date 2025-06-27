"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="a20db320-67b4-56a8-9aa5-23b8183748be")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
require("moment/locale/es");
const discord_js_1 = require("discord.js");
const moment_1 = __importDefault(require("moment"));
const functions_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/functions");
moment_1.default.locale("es");
const commandUserInfo = {
    name: "userinfo",
    description: "The command to get information about a user.",
    examples: ["userinfo @usuario", "userinfo 123456789012345678"],
    nsfw: false,
    owner: false,
    aliases: ["user", "usuario", "uinfo"],
    botpermissions: ["SendMessages", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(client, message, args) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        // Obtener el usuario objetivo
        const targetUser = await await (0, functions_1.getTargetUserv2)(message, args);
        if (!targetUser)
            return message.reply({
                embeds: [
                    {
                        title: "Error User Info",
                        description: [
                            `${client.getEmoji(message.guild.id, "error")} The user was not found.`,
                            `Please mention a user or provide their ID.`,
                        ].join("\n"),
                    },
                ],
            });
        // Obtener el miembro de la guild (si está presente)
        let targetMember;
        try {
            targetMember = await message.guild.members.fetch(targetUser.id);
        }
        catch {
            targetMember = undefined;
        }
        // Crear embeds principales
        const mainEmbed = await (0, functions_1.createMainEmbedv2)(targetUser, targetMember);
        const statusEmbed = await (0, functions_1.createStatusEmbed)(targetUser, targetMember);
        // Componentes interactivos
        const components = await (0, functions_1.createComponentsv2)(targetUser, targetMember);
        // Enviar mensaje
        const msg = await message.reply({
            embeds: [mainEmbed, statusEmbed],
            components: [components.buttons, components.selectMenu],
        });
        // Colector de interacciones
        await (0, functions_1.createCollectorsv2)(msg, targetUser, targetMember);
        return;
    },
};
module.exports = commandUserInfo;
//# sourceMappingURL=user.js.map
//# debugId=a20db320-67b4-56a8-9aa5-23b8183748be
