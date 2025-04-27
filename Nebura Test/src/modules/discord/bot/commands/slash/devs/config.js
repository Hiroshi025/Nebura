"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../main");
const builders_1 = require("../../../../../../modules/discord/structure/utils/builders");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const console_1 = require("../../../../../../shared/utils/functions/console");
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
        const data = await main_1.main.prisma.myDiscord.findUnique({ where: { clientId: client.user.id } });
        if (!data || !guild) {
            return interaction.reply({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Error Configuration")
                        .setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} **Error**`,
                        `No valid configuration found for this server.`,
                    ].join("\n")),
                ],
            });
        }
        const embed = new embeds_extender_1.EmbedCorrect()
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
                                    new embeds_extender_1.EmbedCorrect()
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
                            if (i.values.includes("log-errors")) {
                                const newValue = !data.errorlog;
                                await main_1.main.prisma.myDiscord.update({
                                    where: { clientId: client.user?.id },
                                    data: { errorlog: newValue },
                                });
                                setTimeout(async () => {
                                    await i.update({
                                        embeds: [
                                            new embeds_extender_1.EmbedCorrect()
                                                .setTitle("Configuration")
                                                .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                                `The error log has been ${newValue ? "enabled" : "disabled"}.`),
                                        ],
                                        components: [],
                                    });
                                }, 1000);
                            }
                            else if (i.values.includes("log-debug")) {
                                const newValue = !data.logconsole;
                                await main_1.main.prisma.myDiscord.update({
                                    where: { clientId: client.user?.id },
                                    data: { logconsole: newValue },
                                });
                                setTimeout(async () => {
                                    await i.update({
                                        embeds: [
                                            new embeds_extender_1.EmbedCorrect()
                                                .setTitle("Configuration")
                                                .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                                `The debug log has been ${newValue ? "enabled" : "disabled"}.`),
                                        ],
                                        components: [],
                                    });
                                }, 1000);
                            }
                            else if (i.values.includes("webhook-config")) {
                                const msg = await i.reply({
                                    embeds: [
                                        new embeds_extender_1.EmbedCorrect()
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
                                const webhookCollector = msg.createMessageComponentCollector({
                                    filter: (i) => i.user.id === interaction.user.id,
                                    time: 60000,
                                });
                                webhookCollector.on("collect", async (i) => {
                                    try {
                                        if (i.isButton()) {
                                            switch (i.customId) {
                                                case "button-set-webhook-config":
                                                    {
                                                        const input = new discord_js_1.TextInputBuilder()
                                                            .setCustomId("input-webhook-url")
                                                            .setLabel("Webhook URL")
                                                            .setStyle(1)
                                                            .setPlaceholder("Enter the webhook URL")
                                                            .setRequired(true)
                                                            .setMinLength(10)
                                                            .setMaxLength(2000);
                                                        const row = new discord_js_1.ActionRowBuilder().addComponents(input);
                                                        const modal = new discord_js_1.ModalBuilder()
                                                            .setCustomId("modal-webhook-config")
                                                            .setTitle("Webhook Configuration")
                                                            .addComponents(row);
                                                        await i.showModal(modal);
                                                    }
                                                    break;
                                                case "button-create-webhook-config":
                                                    {
                                                        await i
                                                            .reply({
                                                            embeds: [
                                                                new embeds_extender_1.EmbedCorrect()
                                                                    .setTitle("Configuration")
                                                                    .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                                                    `You have selected the create webhook option.`),
                                                            ],
                                                            components: [
                                                                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ChannelSelectMenuBuilder()
                                                                    .setCustomId("select-webhook-channel")
                                                                    .setPlaceholder("Select a channel to create the webhook")
                                                                    .setChannelTypes([0])),
                                                            ],
                                                        })
                                                            .then(async (dta) => {
                                                            const collector = dta.createMessageComponentCollector({
                                                                filter: (i) => i.user.id === interaction.user.id,
                                                                time: 60000,
                                                            });
                                                            collector.on("collect", async (i) => {
                                                                if (i.isChannelSelectMenu()) {
                                                                    const channel = i.values[0];
                                                                    const guild = await client.guilds.fetch(interaction.guildId);
                                                                    const channelData = (await guild.channels.fetch(channel));
                                                                    if (!channelData)
                                                                        return;
                                                                    const webhook = await channelData.createWebhook({
                                                                        name: "Error Logs",
                                                                        avatar: client.user?.displayAvatarURL(),
                                                                    });
                                                                    await main_1.main.prisma.myDiscord.update({
                                                                        where: { clientId: client.user?.id },
                                                                        data: { webhookURL: webhook.url },
                                                                    });
                                                                    await i.update({
                                                                        embeds: [
                                                                            new embeds_extender_1.EmbedCorrect()
                                                                                .setTitle("Configuration")
                                                                                .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                                                                `The webhook has been created in <#${channel}>`),
                                                                        ],
                                                                        components: [],
                                                                    });
                                                                }
                                                            });
                                                        });
                                                    }
                                                    break;
                                                case "button-delete-webhook-config":
                                                    {
                                                        await i
                                                            .update({
                                                            embeds: [
                                                                new embeds_extender_1.EmbedCorrect()
                                                                    .setTitle("Configuration")
                                                                    .setDescription([
                                                                    `${client.getEmoji(interaction.guildId, "correct")} **Configuration**`,
                                                                    `The webhook URL has been successfully removed, please check \`/config\` again.`,
                                                                ].join("\n")),
                                                            ],
                                                            components: [],
                                                        })
                                                            .then(async () => {
                                                            await main_1.main.prisma.myDiscord.update({
                                                                where: { clientId: client.user?.id },
                                                                data: { webhookURL: null },
                                                            });
                                                        });
                                                    }
                                                    break;
                                            }
                                        }
                                    }
                                    catch (error) {
                                        (0, console_1.logWithLabel)("error", ["Error in webhook collector interaction:", error].join("\n"));
                                    }
                                });
                            }
                            else if (i.values.includes("log-channel-config")) {
                                await i.reply({
                                    embeds: [
                                        new embeds_extender_1.EmbedCorrect()
                                            .setTitle("Configuration")
                                            .setDescription(`${client.getEmoji(interaction.guildId, "correct")} **Configuration**\n` +
                                            `Please select the channel where event and control logs will be sent.`),
                                    ],
                                    components: [
                                        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ChannelSelectMenuBuilder()
                                            .setCustomId("select-log-channel")
                                            .setPlaceholder("Select a channel")
                                            .setChannelTypes([0])),
                                    ],
                                    flags: "Ephemeral",
                                });
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
                new embeds_extender_1.ErrorEmbed()
                    .setTitle("Unexpected Error")
                    .setDescription("An unexpected error occurred. Please try again later."),
            ],
            flags: "Ephemeral",
        });
    }
    return;
});
