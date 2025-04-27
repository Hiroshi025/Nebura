"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const node_schedule_1 = __importDefault(require("node-schedule"));
const main_1 = require("../../../../../../main");
const builders_1 = require("../../../../../../modules/discord/structure/utils/builders");
const functions_1 = require("../../../../../../modules/discord/structure/utils/functions");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
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
                new embeds_extender_1.ErrorEmbed().setDescription([
                    `${client.getEmoji(interaction.guildId, "error")} You need to provide a valid guild!`,
                    `Please use the command in a server.`,
                ].join("\n")),
            ],
        });
    if (!message)
        return interaction.reply({
            embeds: [
                new embeds_extender_1.ErrorEmbed().setDescription([
                    `${client.getEmoji(guild.id, "error")} You need to provide a message!`,
                    `Please use the command with a message.`,
                ].join("\n")),
            ],
        });
    if (time >= 525960 * 1000) {
        return interaction.reply({
            embeds: [
                new embeds_extender_1.ErrorEmbed().setDescription([
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
                new embeds_extender_1.ErrorEmbed().setDescription([
                    `${client.getEmoji(guild.id, "error")} You need to provide a valid guild!`,
                    `Please use the command in a server.`,
                ].join("\n")),
            ],
        });
    }
    await main_1.main.prisma.reminder.create({
        data: {
            userId: member.id,
            guildId: guild.id,
            message: message,
            remindAt: date,
        },
    });
    await interaction.reply({
        embeds: [
            new embeds_extender_1.EmbedCorrect().setTitle(`Set reminder for \`${date.toTimeString()}\`!`).addFields({
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
                new embeds_extender_1.EmbedCorrect()
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
});
