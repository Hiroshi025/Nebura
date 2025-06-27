"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="7ec4a512-a0d3-5aba-ad98-052c7e0c72f8")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.StateCommand = StateCommand;
const main_1 = require("../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../shared/adapters/extends/embeds.extend");
async function StateCommand(interaction, _client) {
    if (!interaction.guild || !interaction.channel)
        return;
    const targetUser = interaction.options.getUser("user") || interaction.user;
    const userEconomy = await main_1.main.prisma.userEconomy.findFirst({
        where: { userId: targetUser.id, guildId: interaction.guild.id },
    });
    if (!userEconomy) {
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("Profile Not Found")
                    .setDescription(`${targetUser.username} does not have an economy profile.`)
                    .setColor("Red"),
            ],
            flags: "Ephemeral",
        });
    }
    const leaderboard = await main_1.main.prisma.userEconomy.findMany({
        where: { guildId: interaction.guild.id },
        orderBy: { balance: "desc" },
        take: 18,
    });
    const userRank = leaderboard.findIndex((entry) => entry.userId === targetUser.id) + 1;
    const top3 = leaderboard.slice(0, 3).map((entry, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
        return `${medal} **${interaction.guild?.members.cache.get(entry.userId)?.user.username || "Unknown"}** - $${entry.balance}`;
    });
    const next15 = leaderboard.length > 3
        ? leaderboard.slice(3).map((entry, index) => {
            const rank = index + 4;
            return `**#${rank}** ${interaction.guild?.members.cache.get(entry.userId)?.user.username || "Unknown"} - $${entry.balance}`;
        })
        : ["No more users available in the leaderboard."];
    // Prepare skills display
    let skillsText = "None";
    if (userEconomy.skills && typeof userEconomy.skills === "object") {
        const skillsObj = userEconomy.skills;
        const entries = Object.entries(skillsObj);
        if (entries.length > 0) {
            skillsText = entries.map(([job, lvl]) => `**${job}**: Lv.${lvl}`).join(", ");
        }
    }
    // Main profile fields
    const profileFields = [
        {
            name: "💵 Balance",
            value: `$${userEconomy.balance}`,
            inline: true,
        },
        {
            name: "🏅 Rank",
            value: `#${userRank}`,
            inline: true,
        },
        {
            name: "🌟 Prestige",
            value: `${userEconomy.prestige ?? 0}`,
            inline: true,
        },
        {
            name: "👍 Reputation",
            value: `${userEconomy.reputation ?? 0}`,
            inline: true,
        },
        {
            name: "💼 Job",
            value: userEconomy.job ? `${userEconomy.job} (Rank ${userEconomy.jobRank ?? 1})` : "None",
            inline: true,
        },
        {
            name: "🗓️ Job Start Date",
            value: userEconomy.jobStartDate
                ? `<t:${Math.floor(new Date(userEconomy.jobStartDate).getTime() / 1000)}:D>`
                : "—",
            inline: true,
        },
        {
            name: "⏰ Last Work",
            value: userEconomy.lastWorkDate
                ? `<t:${Math.floor(new Date(userEconomy.lastWorkDate).getTime() / 1000)}:R>`
                : "—",
            inline: true,
        },
        {
            name: "🛠️ Skills",
            value: skillsText,
            inline: false,
        },
        {
            name: "⚔️ Duels",
            value: `Wins: ${userEconomy.wonduels ?? 0} | Losses: ${userEconomy.lostduels ?? 0}`,
            inline: true,
        },
        {
            name: "💬 Messages Sent",
            value: `${userEconomy.messageCount ?? 0}`,
            inline: true,
        },
    ];
    // Leaderboard fields
    const leaderboardFields = [
        {
            name: "🏆 Top 3 Users",
            value: top3.join("\n") || "No data",
            inline: false,
        },
        {
            name: "📊 Next 15 Users",
            value: next15.join("\n"),
            inline: false,
        },
    ];
    const embed = new embeds_extend_1.EmbedCorrect()
        .setTitle(`💰 Economy Profile`)
        .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
        .setDescription("Here is a detailed summary of your economy status and server leaderboard.")
        .addFields(profileFields)
        .addFields(leaderboardFields)
        .setColor("Blue")
        .setFooter({
        text: `User ID: ${targetUser.id} | Guild: ${interaction.guild.name}`,
        iconURL: interaction.guild.iconURL() ?? undefined,
    });
    return interaction.reply({ embeds: [embed], flags: "Ephemeral" });
}
//# sourceMappingURL=status.js.map
//# debugId=7ec4a512-a0d3-5aba-ad98-052c7e0c72f8
