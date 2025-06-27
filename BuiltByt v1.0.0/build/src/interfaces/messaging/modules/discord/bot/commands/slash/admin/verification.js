"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="121bfeff-d556-5051-9c58-4f82e7dcf0d0")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
/* eslint-disable @typescript-eslint/no-explicit-any */
const builders_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
    .setName("verification")
    .setNameLocalizations({
    "es-ES": "verificacion",
})
    .setDescription("🧶 Manage the verification module")
    .setDescriptionLocalizations({
    "es-ES": "🧶 Administra el módulo de verificación",
})
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) => subcommand
    .setName("configure")
    .setNameLocalizations({
    "es-ES": "configurar",
})
    .setDescription("🧶 Configure the verification module")
    .setDescriptionLocalizations({
    "es-ES": "🧶 Configura el módulo de verificación",
})
    .addBooleanOption((options) => options
    .setName("enable")
    .setNameLocalizations({
    "es-ES": "activar",
})
    .setDescription("🧶 Enable or disable the verification system")
    .setDescriptionLocalizations({
    "es-ES": "🧶 Habilita o deshabilita el sistema de verificación",
})
    .setRequired(true))
    .addRoleOption((options) => options
    .setName("role")
    .setNameLocalizations({
    "es-ES": "rol",
})
    .setDescription("🧶 Choose a role to give to verifiers")
    .setDescriptionLocalizations({
    "es-ES": "🧶 Elige un rol para dar a los verificadores",
})
    .setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName("delete").setDescription("🧶 Delete the verification data.")), async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member || !client.user)
        return;
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
        case "configure":
            {
                const { options, guild } = interaction;
                const isVerificationEnabled = options.getBoolean("enable") ?? false;
                const verificationdRole = options.getRole("role")?.id ?? "";
                const guildId = guild?.id ?? "";
                try {
                    const settings = await main_1.main.prisma.myGuild.findUnique({
                        where: { id: guildId },
                        select: { id: true, captcha: true },
                    });
                    if (settings) {
                        await main_1.main.prisma.captcha.update({
                            where: { id: guildId },
                            data: { isEnabled: isVerificationEnabled, role: verificationdRole },
                        });
                    }
                    else {
                        await main_1.main.prisma.myGuild.create({
                            data: {
                                guildId: guildId,
                                discordId: client.user.id,
                                captcha: {
                                    create: {
                                        isEnabled: isVerificationEnabled,
                                        role: verificationdRole,
                                    },
                                },
                            },
                        });
                    }
                    interaction.reply({
                        embeds: [
                            new embeds_extend_1.EmbedCorrect().setDescription([
                                `${client.getEmoji(interaction.guild.id, "error")} The verification module has been updated successfully.`,
                                `**Enabled:** ${isVerificationEnabled ? "Yes" : "No"}`,
                            ].join("\n")),
                        ],
                        flags: "Ephemeral",
                    });
                }
                catch (error) {
                    console.log(error);
                    interaction.reply({
                        embeds: [
                            new embeds_extend_1.ErrorEmbed().setDescription([
                                `${client.getEmoji(interaction.guild.id, "error")} An error occurred while updating the verification module.`,
                                `**Error:** ${error.message}`,
                            ].join("\n")),
                        ],
                        flags: "Ephemeral",
                    });
                }
            }
            break;
        case "delete":
            {
                const guildId = interaction.guild.id;
                try {
                    await main_1.main.prisma.captcha.deleteMany({
                        where: { guild: { id: guildId } },
                    });
                    await main_1.main.prisma.myGuild.delete({
                        where: { id: guildId },
                    });
                    interaction.reply({
                        embeds: [
                            new embeds_extend_1.EmbedCorrect().setDescription([
                                `${client.getEmoji(interaction.guild.id, "correct")} The data has been deleted successfully.`,
                                `**Guild:** ${interaction.guild.name} (\`${interaction.guild.id}\`)`,
                            ].join("\n")),
                        ],
                        flags: "Ephemeral",
                    });
                }
                catch (error) {
                    interaction.reply({
                        embeds: [
                            new embeds_extend_1.ErrorEmbed().setDescription([
                                `${client.getEmoji(interaction.guild.id, "error")} An error occurred while deleting the data.`,
                                `**Error:** ${error.message}`,
                            ].join("\n")),
                        ],
                        flags: "Ephemeral",
                    });
                }
            }
            break;
    }
});
//# sourceMappingURL=verification.js.map
//# debugId=121bfeff-d556-5051-9c58-4f82e7dcf0d0
