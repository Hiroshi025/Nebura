"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateCommand = StateCommand;
const main_1 = require("../../../../../main");
const embeds_extender_1 = require("../../../../../structure/extenders/discord/embeds.extender");
async function StateCommand(interaction, _client) {
    if (!interaction.guild || !interaction.channel)
        return;
    const targetUser = interaction.options.getUser("user") || interaction.user;
    const userEconomy = await main_1.main.prisma.userEconomy.findFirst({
        where: { userId: targetUser.id, guildId: interaction.guild.id },
    });
    if (!userEconomy) {
        return interaction.reply({
            embeds: [new embeds_extender_1.ErrorEmbed().setDescription(`${targetUser.username} does not have an economy profile.`)],
            flags: "Ephemeral",
        });
    }
    const leaderboard = await main_1.main.prisma.userEconomy.findMany({
        where: { guildId: interaction.guild.id },
        orderBy: { balance: "desc" },
        take: 18, // Top 3 + next 15
    });
    const userRank = leaderboard.findIndex((entry) => entry.userId === targetUser.id) + 1;
    const top3 = leaderboard.slice(0, 3).map((entry, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
        return `${medal} **${interaction.guild?.members.cache.get(entry.userId)?.user.username || "Unknown"}** - $${entry.balance}`;
    });
    const next15 = leaderboard.length > 3
        ? leaderboard.slice(3).map((entry, index) => {
            const rank = index + 4; // Adjust for 1-based index and top 3
            return `**#${rank}** ${interaction.guild?.members.cache.get(entry.userId)?.user.username || "Unknown"} - $${entry.balance}`;
        })
        : ["No more users available in the leaderboard."];
    const embed = new embeds_extender_1.EmbedCorrect()
        .setTitle(`💰 Economy State for ${targetUser.username}`)
        .setDescription([
        `**Your Balance:** $${userEconomy.balance}`,
        `**Your Rank:** #${userRank}`,
        "",
        "**🏆 Top 3 Users:**",
        top3.join("\n"),
        "",
        "**📊 Next 15 Users:**",
        next15.join("\n"),
    ].join("\n"))
        .setColor("Blue");
    return interaction.reply({ embeds: [embed] });
}
