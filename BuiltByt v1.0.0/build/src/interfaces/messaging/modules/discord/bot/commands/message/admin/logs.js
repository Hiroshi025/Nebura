"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="5785904f-ebbd-556f-8fce-f0de219d5feb")}catch(e){}}();

const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const logAdminCommand = {
    name: "logs",
    description: "Get the logs of a user (warns, bans, kicks)",
    examples: ["logs warns @user 3"],
    nsfw: false,
    owner: false,
    aliases: ["modlogs"],
    subcommands: ["logs warns @user page", "logs bans"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(client, message) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const args = message.content.split(/\s+/).slice(1); // Extrae los argumentos del mensaje
        const subCommand = args[0]?.toLowerCase();
        const userMention = message.mentions.users.first();
        const page = parseInt(args[2]) || 1; // Página por defecto es 1 si no se proporciona
        try {
            switch (subCommand) {
                case "warns":
                    {
                        if (!userMention) {
                            return message.channel.send({
                                embeds: [
                                    new embeds_extend_1.ErrorEmbed().setDescription([
                                        `${client.getEmoji(message.guild.id, "error")} User Not Found`,
                                        `Please mention a valid user.`,
                                    ].join("\n")),
                                ],
                            });
                        }
                        const userWarnings = await main_1.main.prisma.userWarn.findMany({
                            where: {
                                userId: userMention.id,
                                guildId: message.guild.id,
                            },
                        });
                        if (!userWarnings?.length) {
                            return message.channel.send({
                                embeds: [
                                    new embeds_extend_1.ErrorEmbed()
                                        .setTitle("No Warnings Found")
                                        .setDescription([
                                        `${client.getEmoji(message.guild.id, "error")} No warnings found for this user.`,
                                        `Please check the server settings or try again later.`,
                                    ].join("\n")),
                                ],
                            });
                        }
                        if (page < 1 || page > Math.ceil(userWarnings.length / 5)) {
                            return message.channel.send({
                                embeds: [
                                    new embeds_extend_1.ErrorEmbed()
                                        .setTitle("Invalid Page Number")
                                        .setDescription(`The page number must be between 1 and ${Math.ceil(userWarnings.length / 5)}.`),
                                ],
                            });
                        }
                        const embed = new embeds_extend_1.EmbedCorrect().setTitle(`${userMention.tag}'s Warning Logs`);
                        const pageNum = 5 * (page - 1);
                        if (userWarnings.length >= 6) {
                            embed.setFooter({
                                text: `Page ${page} of ${Math.ceil(userWarnings.length / 5)}`,
                            });
                        }
                        for (const warnings of userWarnings.splice(pageNum, 5)) {
                            const moderator = message.guild.members.cache.get(warnings.moderator);
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
                        await message.channel.send({ embeds: [embed] });
                    }
                    break;
                case "bans":
                    {
                        const bans = await message.guild.bans.fetch();
                        if (!bans.size) {
                            return message.channel.send({
                                embeds: [
                                    new embeds_extend_1.ErrorEmbed()
                                        .setTitle("No Bans Found")
                                        .setDescription([
                                        `${client.getEmoji(message.guild.id, "error")} No bans found in this guild.`,
                                        `Please check the server settings or try again later.`,
                                    ].join("\n")),
                                ],
                            });
                        }
                        const bansArray = Array.from(bans.values());
                        const maxFieldsPerPage = 10; // Limite de fields por página
                        const totalPages = Math.ceil(bansArray.length / maxFieldsPerPage);
                        let currentPage = Math.min(Math.max(page, 1), totalPages);
                        const generateEmbed = (page) => {
                            const embed = new embeds_extend_1.EmbedCorrect().setTitle("Bans List");
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
                        const embedMessage = await message.channel.send({
                            embeds: [generateEmbed(currentPage)],
                            components: totalPages > 1 ? [row] : [],
                        });
                        if (totalPages > 1) {
                            const collector = embedMessage.createMessageComponentCollector({
                                componentType: discord_js_1.ComponentType.Button,
                                time: 60000, // 1 minuto
                            });
                            collector.on("collect", async (interaction) => {
                                if (interaction.user.id !== message.author.id) {
                                    return interaction.reply({
                                        content: "You cannot interact with this pagination.",
                                        flags: "Ephemeral",
                                    });
                                }
                                if (interaction.customId === "prev_page" && currentPage > 1) {
                                    currentPage--;
                                }
                                else if (interaction.customId === "next_page" && currentPage < totalPages) {
                                    currentPage++;
                                }
                                await interaction.update({
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
                                embedMessage.edit({ components: [] }).catch(() => { });
                            });
                        }
                    }
                    break;
                default:
                    message.channel.send({
                        embeds: [
                            new embeds_extend_1.ErrorEmbed()
                                .setTitle("Invalid Subcommand")
                                .setDescription("Please use a valid subcommand: `warns` or `bans`."),
                        ],
                    });
                    break;
            }
        }
        catch (error) {
            console.error("Error handling logs command:", error);
            await message.channel.send({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setTitle("Unexpected Error")
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "error")} An unexpected error occurred.`,
                        `Please try again later or contact support.`,
                    ].join("\n")),
                ],
            });
        }
        return;
    },
};
module.exports = logAdminCommand;
//# sourceMappingURL=logs.js.map
//# debugId=5785904f-ebbd-556f-8fce-f0de219d5feb
