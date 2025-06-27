"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="4ce0af67-f3c8-5e21-b5a4-bfaf602cec2b")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotsCommand = SlotsCommand;
const main_1 = require("../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../shared/adapters/extends/embeds.extend");
const functions_1 = require("../functions");
const symbols = [
    { emoji: "🍒", weight: 30, multiplier: 2 },
    { emoji: "🍋", weight: 20, multiplier: 3 },
    { emoji: "🍀", weight: 10, multiplier: 5 },
    { emoji: "💎", weight: 5, multiplier: 10 },
    { emoji: "🔥", weight: 2, multiplier: 20 },
];
function getRandomSymbol() {
    const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    for (const symbol of symbols) {
        cumulativeWeight += symbol.weight;
        if (random <= cumulativeWeight) {
            return symbol;
        }
    }
    return symbols[0]; // Default fallback
}
function generateGrid() {
    return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => getRandomSymbol()));
}
function calculateWinnings(grid) {
    const lines = [
        // Horizontal
        [grid[0][0], grid[0][1], grid[0][2]],
        [grid[1][0], grid[1][1], grid[1][2]],
        [grid[2][0], grid[2][1], grid[2][2]],
        // Vertical
        [grid[0][0], grid[1][0], grid[2][0]],
        [grid[0][1], grid[1][1], grid[2][1]],
        [grid[0][2], grid[1][2], grid[2][2]],
        // Diagonal
        [grid[0][0], grid[1][1], grid[2][2]],
        [grid[0][2], grid[1][1], grid[2][0]],
    ];
    let totalMultiplier = 0;
    for (const line of lines) {
        if (line.every((symbol) => symbol.emoji === line[0].emoji)) {
            totalMultiplier += line[0].multiplier;
        }
    }
    return totalMultiplier;
}
async function SlotsCommand(interaction, _client) {
    if (!interaction.guild || !interaction.channel)
        return;
    const user = interaction.user;
    const userBalance = await (0, functions_1.fetchBalance)(user.id, interaction.guild.id);
    let bet = interaction.options.getNumber("bet");
    if (!bet || bet <= 0) {
        return interaction.reply({
            embeds: [new embeds_extend_1.ErrorEmbed().setDescription("You must place a valid bet greater than 0!")],
            flags: "Ephemeral",
        });
    }
    if (bet > userBalance.balance) {
        return interaction.reply({
            embeds: [
                new embeds_extend_1.ErrorEmbed().setDescription(`You don't have enough balance to place this bet! Your current balance is $${userBalance.balance}.`),
            ],
            flags: "Ephemeral",
        });
    }
    const grid = generateGrid();
    const winningsMultiplier = calculateWinnings(grid);
    const winnings = winningsMultiplier * bet;
    const newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance - bet + winnings);
    await main_1.main.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: newBalance },
    });
    const gridDisplay = grid.map((row) => row.map((symbol) => symbol.emoji).join(" ")).join("\n");
    const embed = new embeds_extend_1.EmbedCorrect()
        .setTitle("🎰 Slots Result")
        .setDescription([
        `**Your Bet:** $${bet}`,
        `**Result:**`,
        `\`\`\`\n${gridDisplay}\n\`\`\``,
        winningsMultiplier > 0 ? `🎉 **You won:** $${winnings} (x${winningsMultiplier})` : `😢 **You lost your bet.**`,
        `**New Balance:** $${newBalance}`,
    ].join("\n"))
        .setColor(winningsMultiplier > 0 ? "Green" : "Red");
    return interaction.reply({ embeds: [embed] });
}
//# sourceMappingURL=slots.js.map
//# debugId=4ce0af67-f3c8-5e21-b5a4-bfaf602cec2b
