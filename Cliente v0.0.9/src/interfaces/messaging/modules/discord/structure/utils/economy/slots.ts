import { ChatInputCommandInteraction } from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@utils/extends/embeds.extension";

import { MyClient } from "../../../client";
import { fetchBalance, toFixedNumber } from "../functions";

type SymbolData = {
  emoji: string;
  weight: number;
  multiplier: number;
};

const symbols: SymbolData[] = [
  { emoji: "🍒", weight: 30, multiplier: 2 },
  { emoji: "🍋", weight: 20, multiplier: 3 },
  { emoji: "🍀", weight: 10, multiplier: 5 },
  { emoji: "💎", weight: 5, multiplier: 10 },
  { emoji: "🔥", weight: 2, multiplier: 20 },
];

function getRandomSymbol(): SymbolData {
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

function generateGrid(): SymbolData[][] {
  return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => getRandomSymbol()));
}

function calculateWinnings(grid: SymbolData[][]): number {
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

export async function SlotsCommand(interaction: ChatInputCommandInteraction, _client: MyClient) {
  if (!interaction.guild || !interaction.channel) return;

  const user = interaction.user;
  const userBalance = await fetchBalance(user.id, interaction.guild.id);

  let bet = interaction.options.getNumber("bet");
  if (!bet || bet <= 0) {
    return interaction.reply({
      embeds: [new ErrorEmbed().setDescription("You must place a valid bet greater than 0!")],
      flags: "Ephemeral",
    });
  }

  if (bet > userBalance.balance) {
    return interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          `You don't have enough balance to place this bet! Your current balance is $${userBalance.balance}.`,
        ),
      ],
      flags: "Ephemeral",
    });
  }

  const grid = generateGrid();
  const winningsMultiplier = calculateWinnings(grid);
  const winnings = winningsMultiplier * bet;

  const newBalance = await toFixedNumber(userBalance.balance - bet + winnings);

  await main.prisma.userEconomy.update({
    where: { id: userBalance.id },
    data: { balance: newBalance },
  });

  const gridDisplay = grid.map((row) => row.map((symbol) => symbol.emoji).join(" ")).join("\n");

  const embed = new EmbedCorrect()
    .setTitle("🎰 Slots Result")
    .setDescription(
      [
        `**Your Bet:** $${bet}`,
        `**Result:**`,
        `\`\`\`\n${gridDisplay}\n\`\`\``,
        winningsMultiplier > 0 ? `🎉 **You won:** $${winnings} (x${winningsMultiplier})` : `😢 **You lost your bet.**`,
        `**New Balance:** $${newBalance}`,
      ].join("\n"),
    )
    .setColor(winningsMultiplier > 0 ? "Green" : "Red");

  return interaction.reply({ embeds: [embed] });
}
