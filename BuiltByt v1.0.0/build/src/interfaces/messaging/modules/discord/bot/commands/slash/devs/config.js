"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="1188ed59-7316-5a77-b148-4dbe041e847c")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const builders_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const console_1 = require("../../../../../../../../shared/utils/functions/console");
//TODO: Seguir Mejorandolo
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
    .setName("config")
    .setNameLocalizations({
    "es-ES": "configuracion",
})
    .setDescription("configuration the functions of the discord bot")
    .setDescriptionLocalizations({
    "es-ES": "configuracion las funciones del bot de discord",
}), async (client, interaction) => {
    try {
        if (!interaction.guild || !interaction.channel || !client.user)
            return;
        const guild = await main_1.main.prisma.myGuild.findUnique({
            where: { guildId: interaction.guild.id },
        });
        const data = await main_1.main.DB.findDiscord(client.user.id);
        if (!data || !guild) {
            return interaction.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setTitle("Error Configuration")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} **Error**`,
                        `No valid configuration found for this server.`,
                    ].join("\n")),
                ],
            });
        }
        const embed = new embeds_extend_1.EmbedCorrect()
            .setTitle("Configuration")
            .setDescription([
            `${client.getEmoji(interaction.guild.id, "correct")} **Configuration**`,
            `To configure, select one of the following options:`,
        ].join("\n"));
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel(guild.eventlogs?.enabled ? "Disable Log Events" : "Enable Log Events")
            .setCustomId("button-enabled-logevents")
            .setStyle(guild.eventlogs?.enabled ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setLabel("Cancel")
            .setCustomId("button-set-config-cancel") // Fixed typo
            .setStyle(discord_js_1.ButtonStyle.Danger));
        const menus = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("menu:config-panel")
            .setPlaceholder("Select a configuration option")
            .addOptions(new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel("Enabled Log Errors")
            .setValue("log-errors")
            .setEmoji(data.errorlog
            ? client.getEmoji(interaction.guild.id, "circle_check")
            : client.getEmoji(interaction.guild.id, "circle_x"))
            .setDescription("Enable or disable error logging"), new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel("Enabled Log Debug")
            .setValue("log-debug")
            .setEmoji(data.logconsole
            ? client.getEmoji(interaction.guild.id, "circle_check")
            : client.getEmoji(interaction.guild.id, "circle_x"))
            .setDescription("Enable or disable debug logging"), new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel("Set Webhook")
            .setValue("webhook-config")
            .setEmoji(client.getEmoji(interaction.guild.id, "settings"))
            .setDescription("Set the webhook URL"), new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel("Set Log Channel")
            .setValue("log-channel-config")
            .setEmoji(client.getEmoji(interaction.guild.id, "folder"))
            .setDescription("Set the channel for event and control logs")));
        const message = await interaction.reply({
            embeds: [embed],
            components: [menus, buttons],
            flags: "Ephemeral",
        });
        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000,
        });
        collector.on("collect", async (i) => {
            try {
                if (i.isButton()) {
                    switch (i.customId) {
                        case "button-set-config-cancel":
                            await i.update({
                                embeds: [
                                    new embeds_extend_1.EmbedCorrect()
                                        .setTitle("Configuration")
                                        .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                        `The configuration has been cancelled.`),
                                ],
                                components: [],
                            });
                            collector.stop();
                            break;
                    }
                }
                else if (i.isStringSelectMenu()) {
                    switch (i.customId) {
                        case "menu:config-panel":
                            switch (i.values[0] // <--- Mejor escalabilidad
                            ) {
                                case "log-errors": {
                                    const newValue = !data.errorlog;
                                    await main_1.main.prisma.discord.update({
                                        where: { clientId: client.user?.id },
                                        data: {
                                            errorlog: newValue,
                                        },
                                    });
                                    setTimeout(async () => {
                                        await i.update({
                                            embeds: [
                                                new embeds_extend_1.EmbedCorrect()
                                                    .setTitle("Configuration")
                                                    .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                                    `The error log has been ${newValue ? "enabled" : "disabled"}.`),
                                            ],
                                            components: [],
                                        });
                                    }, 1000);
                                    break;
                                }
                                case "log-debug": {
                                    const newValue = !data.logconsole;
                                    await main_1.main.prisma.discord.update({
                                        where: { clientId: client.user?.id },
                                        data: {
                                            logconsole: newValue,
                                        },
                                    });
                                    setTimeout(async () => {
                                        await i.update({
                                            embeds: [
                                                new embeds_extend_1.EmbedCorrect()
                                                    .setTitle("Configuration")
                                                    .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                                    `The debug log has been ${newValue ? "enabled" : "disabled"}.`),
                                            ],
                                            components: [],
                                        });
                                    }, 1000);
                                    break;
                                }
                                case "webhook-config": {
                                    await i.reply({
                                        embeds: [
                                            new embeds_extend_1.EmbedCorrect()
                                                .setTitle("Configuration")
                                                .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                                `You have selected the webhook configuration option.`),
                                        ],
                                        components: [
                                            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                                                .setLabel("Set URL")
                                                .setCustomId("button-set-webhook-config")
                                                .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
                                                .setLabel("Create")
                                                .setCustomId("button-create-webhook-config")
                                                .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
                                                .setLabel("Delete")
                                                .setCustomId("button-delete-webhook-config")
                                                .setStyle(discord_js_1.ButtonStyle.Danger)),
                                        ],
                                        flags: "Ephemeral",
                                    });
                                    break;
                                }
                                case "log-channel-config": {
                                    await i.reply({
                                        embeds: [
                                            new embeds_extend_1.EmbedCorrect()
                                                .setTitle("Configuration")
                                                .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                                `Please select the channel where event and control logs will be sent.`),
                                        ],
                                        components: [
                                            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ChannelSelectMenuBuilder()
                                                .setCustomId("select-log-channel")
                                                .setPlaceholder("Select a channel")
                                                .setChannelTypes([discord_js_1.ChannelType.GuildText])),
                                        ],
                                        flags: "Ephemeral",
                                    });
                                    break;
                                }
                                default:
                                    break;
                            }
                            break;
                    }
                }
            }
            catch (error) {
                (0, console_1.logWithLabel)("error", ["Error in collector interaction:", error].join("\n"));
            }
        });
        collector.on("end", async () => {
            try {
                await interaction.editReply({
                    components: [],
                });
            }
            catch (error) {
                (0, console_1.logWithLabel)("error", ["Error in collector end interaction:", error].join("\n"));
            }
        });
        return message;
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", ["Error in config command:", error].join("\n"));
        await interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("Unexpected Error")
                    .setDescription("An unexpected error occurred. Please try again later."),
            ],
            flags: "Ephemeral",
        });
    }
    return;
});
//# sourceMappingURL=config.js.map
//# debugId=1188ed59-7316-5a77-b148-4dbe041e847c
