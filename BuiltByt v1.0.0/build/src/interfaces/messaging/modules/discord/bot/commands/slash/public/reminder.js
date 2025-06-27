"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="c7dbc1c5-9660-52f7-a9dc-03529291726c")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const node_schedule_1 = __importDefault(require("node-schedule"));
const builders_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const functions_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/functions");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
    .setName("remind")
    .setNameLocalizations({
    "es-ES": "recordar",
})
    .setDescription("Set a message reminder")
    .setDescriptionLocalizations({
    "es-ES": "Establecer un recordatorio de mensaje",
})
    .addStringOption((option) => {
    return option
        .setName("message")
        .setNameLocalizations({
        "es-ES": "mensaje",
    })
        .setDescription("The messaged to be reminded")
        .setDescriptionLocalizations({
        "es-ES": "El mensaje a recordar",
    })
        .setRequired(true)
        .setMaxLength(2000)
        .setMinLength(10);
})
    .addIntegerOption((option) => {
    return option
        .setName("time")
        .setNameLocalizations({
        "es-ES": "tiempo",
    })
        .setDescription("The time to send the message at. (IN MINUTES)")
        .setDescriptionLocalizations({
        "es-ES": "El tiempo para enviar el mensaje. (EN MINUTOS)",
    })
        .setRequired(true)
        .setMinValue(1);
}), async (client, interaction) => {
    const message = interaction.options.getString("message");
    const time = interaction.options.getInteger("time");
    const { guild, member } = interaction;
    if (!guild || !time || !member)
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setDescription([
                    `${client.getEmoji(interaction.guildId, "error")} You need to provide a valid guild!`,
                    `Please use the command in a server.`,
                ].join("\n")),
            ],
        });
    if (!message)
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setDescription([
                    `${client.getEmoji(guild.id, "error")} You need to provide a message!`,
                    `Please use the command with a message.`,
                ].join("\n")),
            ],
        });
    if (time >= 525960 * 1000) {
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setDescription([
                    `${client.getEmoji(guild.id, "error")} You cannot set a reminder for more than \`1 Year\`!`,
                    `Please use a smaller time value.`,
                ].join("\n")),
            ],
        });
    }
    const timeMs = time * 60000;
    const guuldIdValidate = await (0, functions_1.isValidObjectId)(guild.id);
    const date = new Date(new Date().getTime() + timeMs);
    if (!guuldIdValidate) {
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setDescription([
                    `${client.getEmoji(guild.id, "error")} You need to provide a valid guild!`,
                    `Please use the command in a server.`,
                ].join("\n")),
            ],
        });
    }
    await main_1.main.prisma.reminder.create({
        data: {
            userId: member.id,
            guildId: guild.id, // almacenar como string según el esquema de Prisma
            message: message,
            remindAt: date,
        },
    });
    await interaction.reply({
        embeds: [
            new embeds_extend_1.EmbedCorrect().setTitle(`Set reminder for \`${date.toTimeString()}\`!`).addFields({
                name: `${client.getEmoji(guild.id, "clock")} Will be sent in`,
                value: `${client.getEmoji(guild.id, "reply")} ${time} Minute(s)`,
                inline: true,
            }, {
                name: `${client.getEmoji(guild.id, "message")} Message`,
                value: `${client.getEmoji(guild.id, "reply")} \`${message}\``,
                inline: true,
            }),
        ],
        flags: "Ephemeral",
    });
    node_schedule_1.default.scheduleJob(date, async () => {
        // Actualizar el estado del recordatorio en la base de datos
        await main_1.main.prisma.reminder.updateMany({
            where: { userId: member.id, guildId: guild.id, remindAt: date },
            data: { isSent: true },
        });
        await member
            .send({
            embeds: [
                new embeds_extend_1.EmbedCorrect()
                    .setTitle(`Reminder for: ${date.toTimeString()}!`)
                    .setDescription([
                    `${client.getEmoji(guild.id, "clock")} Reminder set for \`${time} Minute(s)\`!`,
                    `${client.getEmoji(guild.id, "message")} Message: \`${message}\``,
                ].join("\n")),
            ],
        })
            .catch(() => { });
    });
    return;
}, undefined, 10, true);
//# sourceMappingURL=reminder.js.map
//# debugId=c7dbc1c5-9660-52f7-a9dc-03529291726c
