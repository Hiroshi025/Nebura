"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="4cfd5ce3-979a-5905-be1b-c3f58082cb45")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const builders_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
    .setName("warn")
    .setNameLocalizations({
    "es-ES": "advertir",
})
    .setDescription("Warn a user or remove a warn")
    .setDescriptionLocalizations({
    "es-ES": "Advertir a un usuario o eliminar una advertencia",
})
    .addSubcommand((subCmd) => subCmd
    .setName("add")
    .setNameLocalizations({
    "es-ES": "agregar",
})
    .setDescription("Warn a user")
    .setDescriptionLocalizations({
    "es-ES": "Advertir a un usuario",
})
    .addUserOption((option) => {
    return option
        .setName("user")
        .setNameLocalizations({
        "es-ES": "usuario",
    })
        .setDescription("The user to warn")
        .setDescriptionLocalizations({
        "es-ES": "El usuario a advertir",
    })
        .setRequired(true);
})
    .addStringOption((option) => {
    return option
        .setName("reason")
        .setNameLocalizations({
        "es-ES": "razón",
    })
        .setDescription("The reason for the warn")
        .setDescriptionLocalizations({
        "es-ES": "La razón de la advertencia",
    })
        .setRequired(true)
        .setMinLength(5)
        .setMaxLength(500);
}))
    .addSubcommand((subCmd) => subCmd
    .setName("remove")
    .setNameLocalizations({
    "es-ES": "eliminar",
})
    .setDescription("Remove a warn from a user")
    .setDescriptionLocalizations({
    "es-ES": "Eliminar una advertencia de un usuario",
})
    .addStringOption((option) => {
    return option
        .setName("warn_id")
        .setNameLocalizations({
        "es-ES": "id_advertencia",
    })
        .setDescription("The id of the warn to remove")
        .setDescriptionLocalizations({
        "es-ES": "El id de la advertencia a eliminar",
    })
        .setRequired(true);
})), async (client, interaction) => {
    switch (interaction.options.getSubcommand()) {
        case "add":
            {
                const { options, guild, member } = interaction;
                const user = options.getUser("user");
                const reason = options.getString("reason") || "Not provided reason the warn";
                const warnTime = (0, discord_js_1.time)();
                if (!guild || !member || !user)
                    return interaction.reply({
                        embeds: [
                            new embeds_extend_1.ErrorEmbed().setDescription([
                                `${client.getEmoji(interaction.guildId, "error")} Warn Error Options`,
                                `Check the data entered and where you are executing the command`,
                            ].join("\n")),
                        ],
                    });
                await main_1.main.prisma.userWarn.create({
                    data: {
                        guildId: guild.id,
                        userId: user.id,
                        warnReason: reason,
                        moderator: member.user.id,
                        warnDate: warnTime,
                    },
                });
                await interaction.reply({
                    embeds: [
                        new embeds_extend_1.EmbedCorrect()
                            .setTitle("User warned!")
                            .setDescription(`<@${user.id}> has been warned for \`${reason}\`!`),
                    ],
                    flags: "Ephemeral",
                });
                const modData = await main_1.main.prisma.serverModlog.findFirst({
                    where: { guildId: guild.id },
                });
                const data = await main_1.main.prisma.userWarn.findFirst({
                    where: {
                        guildId: guild.id,
                        userId: user.id,
                    },
                });
                if (modData) {
                    const channel = client.channels.cache.get(modData.channelId);
                    channel.send({
                        embeds: [
                            new embeds_extend_1.EmbedCorrect().setTitle("New user warned").addFields({
                                name: "User warned",
                                value: `<@${user.id}>`,
                                inline: true,
                            }, {
                                name: "Warned by",
                                value: `<@${member.user.id}>`,
                                inline: true,
                            }, {
                                name: "Warned at",
                                value: `${warnTime}`,
                                inline: true,
                            }, {
                                name: "Warn ID",
                                value: `\`${data?.id ? data.id : "Not ID"}\``,
                                inline: true,
                            }, {
                                name: "Warn Reason",
                                value: `\`\`\`${reason}\`\`\``,
                            }),
                        ],
                    });
                }
                user
                    .send({
                    embeds: [
                        new embeds_extend_1.EmbedCorrect()
                            .setTitle(`You have been warned in: ${guild.name}`)
                            .addFields({
                            name: "Warned for",
                            value: `\`${reason}\``,
                            inline: true,
                        }, {
                            name: "Warned at",
                            value: `${warnTime}`,
                            inline: true,
                        })
                            .setColor("#2f3136"),
                    ],
                })
                    .catch(async () => {
                    await interaction.followUp({
                        embeds: [
                            new embeds_extend_1.ErrorEmbed()
                                .setTitle("DM Notification Failed")
                                .setDescription("The user has DMs disabled, so no notification was sent."),
                        ],
                        flags: "Ephemeral",
                    });
                });
            }
            break;
        case "remove": {
            const warnId = interaction.options.getString("warn_id");
            if (!warnId)
                return interaction.reply({
                    embeds: [
                        new embeds_extend_1.ErrorEmbed().setDescription([
                            `${client.getEmoji(interaction.guildId, "error")} Warn Error Options`,
                            `Check the data entered and where you are executing the command`,
                        ].join("\n")),
                    ],
                });
            const data = await main_1.main.prisma.userWarn.findUnique({ where: { id: warnId } });
            const err = new embeds_extend_1.EmbedCorrect().setDescription(`No warn Id watching \`${warnId}\` was found!`);
            if (!data)
                return await interaction.reply({ embeds: [err] });
            await main_1.main.prisma.userWarn.delete({ where: { id: warnId } });
            const embed = new embeds_extend_1.EmbedCorrect()
                .setTitle("Remove Infraction")
                .setDescription(`Successfully removed the warn with the ID matching ${warnId}`);
            return await interaction.reply({ embeds: [embed] });
        }
    }
    return;
});
//# sourceMappingURL=warn.js.map
//# debugId=4cfd5ce3-979a-5905-be1b-c3f58082cb45
