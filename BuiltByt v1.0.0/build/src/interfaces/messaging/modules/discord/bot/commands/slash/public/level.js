"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="be7f8615-71c4-5fbe-8d7e-fe11ee355313")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const discord_arts_1 = require("discord-arts");
const discord_js_1 = require("discord.js");
const builders_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/builders");
const helpers_1 = require("../../../../../../../../interfaces/messaging/modules/discord/structure/utils/ranking/helpers");
const main_1 = require("../../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
exports.default = new builders_1.Command(new discord_js_1.SlashCommandBuilder()
    .setName("levels")
    .setNameLocalizations({
    "es-ES": "niveles",
})
    .setDescription("👾 Check your level and experience")
    .setDescriptionLocalizations({
    "es-ES": "👾 Comprueba tu nivel y experiencia",
})
    .addSubcommand((subcommand) => subcommand
    .setName("view")
    .setNameLocalizations({
    "es-ES": "ver",
})
    .setDescription("👾 View your or another member’s level and exp progress")
    .setDescriptionLocalizations({
    "es-ES": "👾 Ver tu progreso de nivel y experiencia o el de otro miembro",
})
    .addUserOption((option) => option
    .setName("member")
    .setNameLocalizations({
    "es-ES": "miembro",
})
    .setDescription("👾 Member you’d like to view")
    .setDescriptionLocalizations({
    "es-ES": "👾 Miembro del que te gustaría ver",
})))
    .addSubcommand((subcommand) => subcommand
    .setName("top")
    .setNameLocalizations({
    "es-ES": "top",
})
    .setDescription("🏆 View the top level ranking with achievements")
    .setDescriptionLocalizations({
    "es-ES": "🏆 Ver el ranking top de niveles con logros",
})), async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !(interaction.member instanceof discord_js_1.GuildMember))
        return;
    await interaction.deferReply(); // Ensure the response doesn't take too long
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
        case "view": {
            try {
                const targetMember = interaction.options.getMember("member") || interaction.member;
                // Get user data from the database
                const user = await main_1.main.prisma.userLevel.findFirst({
                    where: {
                        userId: targetMember.user.id,
                        guildId: interaction.guild.id,
                    },
                });
                if (!user) {
                    await interaction.followUp({
                        embeds: [
                            new embeds_extend_1.ErrorEmbed()
                                .setColor("Red")
                                .setDescription(`${client.getEmoji(interaction.guild.id, "error")} This user hasn't sent any messages yet. Start chatting to appear in the leaderboard.`),
                        ],
                    });
                    return;
                }
                // Visual data for the profile card
                const buffer = await (0, discord_arts_1.Profile)(targetMember.id, {
                    borderColor: user.borderColor || "#000000",
                    presenceStatus: targetMember.presence?.status || "offline",
                    customBackground: user.background || undefined,
                    moreBackgroundBlur: !!user.blur,
                    rankData: {
                        currentXp: user.xp || 0,
                        requiredXp: user.level * 100 || 100,
                        level: user.level || 1,
                        barColor: user.barColor || "#087996",
                    },
                });
                const attachment = new discord_js_1.AttachmentBuilder(buffer, {
                    name: "profile.png",
                });
                // Respond with the profile card and level details
                await interaction.followUp({
                    embeds: [
                        new embeds_extend_1.EmbedCorrect()
                            .setColor("Blue")
                            .setDescription(`> **Level:** ${user.level || 1}\n> **Experience:** ${user.xp || 0}`)
                            .setImage(`attachment://profile.png`),
                    ],
                    files: [attachment],
                });
            }
            catch (error) {
                console.error(error);
                await interaction.followUp({
                    embeds: [
                        new embeds_extend_1.ErrorEmbed()
                            .setColor("Red")
                            .setDescription(`${client.getEmoji(interaction.guild.id, "error")} An error occurred while fetching user data. Please try again later.`),
                    ],
                });
            }
            break;
        }
        case "top": {
            try {
                // Get the top 10 users by level and XP
                const topUsers = await (0, helpers_1.getTopUsers)(interaction.guild.id, "xp", 10);
                if (!topUsers || topUsers.length === 0) {
                    await interaction.followUp({
                        embeds: [
                            new embeds_extend_1.ErrorEmbed()
                                .setColor("Red")
                                .setDescription(`${client.getEmoji(interaction.guild.id, "error")} There are no users in the ranking yet.`),
                        ],
                    });
                    return;
                }
                // Get achievement details for each user
                const usersWithAchievements = await Promise.all(topUsers.map(async (user, i) => {
                    const member = await interaction.guild.members.fetch(user.userId).catch(() => null);
                    const achievements = await main_1.main.prisma.userAchievements.findUnique({
                        where: { userId_guildId: { userId: user.userId, guildId: interaction.guild.id } },
                    });
                    return {
                        position: i + 1,
                        user,
                        member,
                        achievements: achievements?.achievements ?? [],
                    };
                }));
                // Build the ranking text
                const rankingText = usersWithAchievements
                    .map((entry) => `**#${entry.position}** ${entry.member ? entry.member.user.tag : `<@${entry.user.userId}>`} - Level: **${entry.user.level}**${entry.user.prestige > 0 ? ` (P${entry.user.prestige})` : ""} - XP: **${entry.user.xp}**\nAchievements: ${entry.achievements.length > 0 ? entry.achievements.map(() => `🏅`).join("") : "None"}`)
                    .join("\n\n");
                // Create the ranking embed
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle("🏆 Level Ranking")
                    .setColor("Gold")
                    .setDescription(rankingText)
                    .setFooter({ text: "Keep participating to climb the ranking!" });
                await interaction.followUp({ embeds: [embed] });
            }
            catch (error) {
                console.error(error);
                await interaction.followUp({
                    embeds: [
                        new embeds_extend_1.ErrorEmbed()
                            .setColor("Red")
                            .setDescription(`${client.getEmoji(interaction.guild.id, "error")} An error occurred while fetching the ranking.`),
                    ],
                });
            }
            break;
        }
    }
});
//# sourceMappingURL=level.js.map
//# debugId=be7f8615-71c4-5fbe-8d7e-fe11ee355313
