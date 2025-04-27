"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../main");
const builders_1 = require("../../../../../../modules/discord/structure/utils/builders");
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
    .setName("logs")
    .setNameLocalizations({
    "es-ES": "registros",
})
    .setDescription("Get the logs of a user")
    .setDescriptionLocalizations({
    "es-ES": "Obtener los registros de un usuario",
})
    .addSubcommand((subCmd) => subCmd
    .setName("bans")
    .setNameLocalizations({
    "es-ES": "baneos",
})
    .setDescription("Get the bans of a user in the guild all")
    .setDescriptionLocalizations({
    "es-ES": "Obtener los baneos de un usuario en la guild",
}))
    .addSubcommand((subCmd) => subCmd
    .setName("warns")
    .setNameLocalizations({
    "es-ES": "advertencias",
})
    .setDescription("Get the warns of a user")
    .setDescriptionLocalizations({
    "es-ES": "Obtener las advertencias de un usuario",
})
    .addUserOption((option) => {
    return option
        .setName("user")
        .setNameLocalizations({
        "es-ES": "usuario",
    })
        .setDescription("User to get the warn logs for")
        .setDescriptionLocalizations({
        "es-ES": "Usuario para obtener los registros de advertencia",
    })
        .setRequired(true);
})
    .addIntegerOption((option) => {
    return option
        .setName("page")
        .setNameLocalizations({
        "es-ES": "página",
    })
        .setDescription("The page to display if there are more than 1")
        .setDescriptionLocalizations({
        "es-ES": "La página a mostrar si hay más de 1",
    })
        .setMinValue(2)
        .setMaxValue(20);
})), async (client, interaction) => {
    try {
        if (!interaction.guild || !interaction.channel || !interaction.user)
            return;
        switch (interaction.options.getSubcommand()) {
            case "warns":
                {
                    const user = interaction.options.getUser("user");
                    const page = interaction.options.getInteger("page") || 1; // Default to page 1 if not provided
                    if (!user)
                        return interaction.reply({
                            embeds: [
                                new embeds_extender_1.ErrorEmbed().setDescription([
                                    `${client.getEmoji(interaction.guildId, "error")} User Not Found`,
                                    `Please provide a valid user.`,
                                ].join("\n")),
                            ],
                            flags: "Ephemeral",
                        });
                    const userWarnings = await main_1.main.prisma.userWarn.findMany({
                        where: {
                            userId: user.id,
                            guildId: interaction.guild.id,
                        },
                    });
                    if (!userWarnings?.length)
                        return interaction.reply({
                            embeds: [
                                new embeds_extender_1.ErrorEmbed()
                                    .setTitle("No Warnings Found")
                                    .setDescription([
                                    `${client.getEmoji(interaction.guildId, "error")} No warnings found for this user.`,
                                    `Please check the server settings or try again later.`,
                                ].join("\n"))
                            ],
                            flags: "Ephemeral",
                        });
                    if (page < 1 || page > Math.ceil(userWarnings.length / 5)) {
                        return interaction.reply({
                            embeds: [
                                new embeds_extender_1.ErrorEmbed()
                                    .setTitle("Invalid Page Number")
                                    .setDescription(`The page number must be between 1 and ${Math.ceil(userWarnings.length / 5)}.`),
                            ],
                            flags: "Ephemeral",
                        });
                    }
                    const embed = new embeds_extender_1.EmbedCorrect().setTitle(`${user.tag}'s Warning Logs`);
                    const pageNum = 5 * (page - 1);
                    if (userWarnings.length >= 6) {
                        embed.setFooter({
                            text: `Page ${page} of ${Math.ceil(userWarnings.length / 5)}`,
                        });
                    }
                    for (const warnings of userWarnings.splice(pageNum, 5)) {
                        const moderator = interaction.guild.members.cache.get(warnings.moderator);
                        embed.addFields({
                            name: `ID: ${warnings.id}`,
                            value: [
                                `> Moderator: ${moderator || "Moderator left"}`,
                                `> User: ${warnings.userId}`,
                                `> Reason: \`${warnings.warnReason}\``,
                                `> Date: ${warnings.warnDate}`,
                            ].join("\n"),
                        });
                    }
                    await interaction.reply({ embeds: [embed] });
                }
                break;
            case "bans":
                {
                    const bans = await interaction.guild.bans.fetch();
                    if (!bans.size) {
                        return interaction.reply({
                            embeds: [
                                new embeds_extender_1.ErrorEmbed()
                                    .setTitle("No Bans Found")
                                    .setDescription([
                                    `${client.getEmoji(interaction.guildId, "error")} No bans found in this guild.`,
                                    `Please check the server settings or try again later.`,
                                ].join("\n"))
                            ],
                            flags: "Ephemeral",
                        });
                    }
                    const bansArray = Array.from(bans.values());
                    const maxFieldsPerPage = 10; // Limite de fields por página
                    const totalPages = Math.ceil(bansArray.length / maxFieldsPerPage);
                    let currentPage = 1;
                    const generateEmbed = (page) => {
                        const embed = new embeds_extender_1.EmbedCorrect().setTitle("Bans List");
                        const start = (page - 1) * maxFieldsPerPage;
                        const end = start + maxFieldsPerPage;
                        bansArray.slice(start, end).forEach((ban) => {
                            embed.addFields({
                                name: `User: ${ban.user.tag}`,
                                value: `ID: ${ban.user.id}`,
                            });
                        });
                        embed.setFooter({ text: `Page ${page} of ${totalPages}` });
                        return embed;
                    };
                    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId("prev_page")
                        .setLabel("Previous")
                        .setStyle(discord_js_1.ButtonStyle.Primary)
                        .setDisabled(currentPage === 1), new discord_js_1.ButtonBuilder()
                        .setCustomId("next_page")
                        .setLabel("Next")
                        .setStyle(discord_js_1.ButtonStyle.Primary)
                        .setDisabled(currentPage === totalPages));
                    const message = await interaction.reply({
                        embeds: [generateEmbed(currentPage)],
                        components: totalPages > 1 ? [row] : [],
                        fetchReply: true,
                    });
                    if (totalPages > 1) {
                        const collector = message.createMessageComponentCollector({
                            componentType: discord_js_1.ComponentType.Button,
                            time: 60000, // 1 minuto
                        });
                        collector.on("collect", async (i) => {
                            if (i.user.id !== interaction.user.id) {
                                return i.reply({
                                    content: "You cannot interact with this pagination.",
                                    ephemeral: true,
                                });
                            }
                            if (i.customId === "prev_page" && currentPage > 1) {
                                currentPage--;
                            }
                            else if (i.customId === "next_page" && currentPage < totalPages) {
                                currentPage++;
                            }
                            await i.update({
                                embeds: [generateEmbed(currentPage)],
                                components: [
                                    new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                                        .setCustomId("prev_page")
                                        .setLabel("Previous")
                                        .setStyle(discord_js_1.ButtonStyle.Primary)
                                        .setDisabled(currentPage === 1), new discord_js_1.ButtonBuilder()
                                        .setCustomId("next_page")
                                        .setLabel("Next")
                                        .setStyle(discord_js_1.ButtonStyle.Primary)
                                        .setDisabled(currentPage === totalPages)),
                                ],
                            });
                            return;
                        });
                        collector.on("end", () => {
                            message.edit({ components: [] }).catch(() => { });
                        });
                    }
                }
                break;
        }
    }
    catch (error) {
        console.error("Error handling logs command:", error);
        await interaction.reply({
            embeds: [
                new embeds_extender_1.ErrorEmbed()
                    .setTitle("Unexpected Error")
                    .setDescription([
                    `${client.getEmoji(interaction.guildId, "error")} An unexpected error occurred.`,
                    `Please try again later or contact support.`,
                ].join("\n"))
            ],
            flags: "Ephemeral",
        });
    }
    return;
});
