import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@/shared/structure/extenders/discord/embeds.extend";

import { MyClient } from "../../../client";
import { fetchBalance, toFixedNumber } from "../functions";

const rouletteNumbers = [
  { number: 0, color: "🟢" },
  { number: 1, color: "🔴" },
  { number: 2, color: "⚫" },
  { number: 3, color: "🔴" },
  { number: 4, color: "⚫" },
  { number: 5, color: "🔴" },
  { number: 6, color: "⚫" },
  { number: 7, color: "🔴" },
  { number: 8, color: "⚫" },
  { number: 9, color: "🔴" },
  { number: 10, color: "⚫" },
  { number: 11, color: "⚫" },
  { number: 12, color: "🔴" },
  { number: 13, color: "⚫" },
  { number: 14, color: "🔴" },
  { number: 15, color: "⚫" },
  { number: 16, color: "🔴" },
  { number: 17, color: "⚫" },
  { number: 18, color: "🔴" },
  { number: 19, color: "🔴" },
  { number: 20, color: "⚫" },
  { number: 21, color: "🔴" },
  { number: 22, color: "⚫" },
  { number: 23, color: "🔴" },
  { number: 24, color: "⚫" },
  { number: 25, color: "🔴" },
  { number: 26, color: "⚫" },
  { number: 27, color: "🔴" },
  { number: 28, color: "⚫" },
  { number: 29, color: "⚫" },
  { number: 30, color: "🔴" },
  { number: 31, color: "⚫" },
  { number: 32, color: "🔴" },
  { number: 33, color: "⚫" },
  { number: 34, color: "🔴" },
  { number: 35, color: "⚫" },
  { number: 36, color: "🔴" },
];

let winStreak = 0;
let riskMultiplier = 1;
let greenStreak = 0;
let accumulatedWinnings = 0;

export async function RouletteCommand(interaction: ChatInputCommandInteraction, _client: MyClient) {
  if (!interaction.guild || !interaction.channel) return;

  const user = interaction.user;
  const userBalance = await fetchBalance(user.id, interaction.guild.id);

  if (userBalance.balance <= 0) {
    return interaction.reply({
      embeds: [new ErrorEmbed().setDescription("You don't have enough money to play!")],
      flags: "Ephemeral",
    });
  }

  let bet = interaction.options.getNumber("bet");
  const chosenNumber = interaction.options.getNumber("number");
  const chosenColor = interaction.options.getString("color");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("stop_roulette")
      .setLabel("🛑 Stop Roulette")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("bet_all")
      .setLabel("💰 Bet All")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("withdraw_winnings")
      .setLabel("🏦 Withdraw")
      .setStyle(ButtonStyle.Success),
  );

  const updateAccumulatedMessage = async () => {
    const accumulatedEmbed = new EmbedCorrect()
      .setTitle("🏦 Accumulated Winnings")
      .setDescription(`Your current accumulated winnings: **$${accumulatedWinnings}**`)
      .setColor("Blue");

    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) return;
    await interaction.channel.send({ embeds: [accumulatedEmbed] });
  };

  await updateAccumulatedMessage();

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

  const embed = new EmbedCorrect()
    .setTitle("🎡 Roulette Game")
    .setDescription(
      `**Your Bet:** $${bet}\n\nThe roulette is spinning... Press "Stop Roulette" to stop it!`,
    )
    .setColor("Orange");

  const message = await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: false,
  });

  const collector = message.createMessageComponentCollector({
    filter: (i) =>
      i.user.id === user.id &&
      ["stop_roulette", "bet_all", "withdraw_winnings"].includes(i.customId),
    time: 15000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "bet_all") {
      bet = userBalance.balance;
      await i.reply({
        content: `You have bet all your money: $${bet}. The roulette continues spinning!`,
        ephemeral: true,
      });
      return;
    }

    if (i.customId === "withdraw_winnings") {
      const finalBalance = await toFixedNumber(userBalance.balance + accumulatedWinnings);
      await main.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: finalBalance },
      });

      await i.reply({
        embeds: [
          new EmbedCorrect()
            .setDescription(
              `🏦 You have successfully withdrawn **$${accumulatedWinnings}** to your balance. Your new balance is **$${finalBalance}**.`,
            )
            .setColor("Green"),
        ],
        ephemeral: true,
      });

      accumulatedWinnings = 0;
      await updateAccumulatedMessage();
      return;
    }

    collector.stop();

    const result = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)];
    const isNumberWin = chosenNumber === result.number;
    const isColorWin = chosenColor?.toLowerCase() === result.color.toLowerCase();
    let winnings = 0;

    if (isNumberWin) {
      winnings = await toFixedNumber((bet ?? 0) * 36 * riskMultiplier);
      winStreak++;
    } else if (isColorWin) {
      winnings =
        result.color === "🟢"
          ? await toFixedNumber((bet ?? 0) * 14 * riskMultiplier)
          : await toFixedNumber((bet ?? 0) * 2 * riskMultiplier);
      winStreak++;
    } else {
      winStreak = 0;
      riskMultiplier = 1;
    }

    if (result.color === "🟢") {
      greenStreak++;
      if (greenStreak === 3) {
        winnings += 1000; // Jackpot bonus
        greenStreak = 0;
      }
    } else {
      greenStreak = 0;
    }

    if (winStreak === 3) {
      winnings += 500; // Free bet bonus
      riskMultiplier += 0.2; // Activate "hot mode"
    }

    if (winnings > 0) {
      riskMultiplier += 0.2; // Increase multiplier for consecutive wins
    }

    const newBalance = await toFixedNumber(userBalance.balance + winnings - (bet ?? 0));

    await main.prisma.userEconomy.update({
      where: { id: userBalance.id },
      data: { balance: newBalance },
    });

    const resultEmbed = new EmbedCorrect()
      .setTitle("🎡 Roulette Result")
      .setDescription(
        `The roulette stopped at **${result.color} ${result.number}**.\n\n` +
          (winnings > 0
            ? `🎉 **You won $${winnings}!** Your new balance is **$${newBalance}**.\n\n` +
              `🔥 **Win Streak:** ${winStreak} | **Multiplier:** x${riskMultiplier.toFixed(2)}`
            : `😢 **You lost $${bet}.** Better luck next time! Your new balance is **$${newBalance}**.`),
      )
      .setColor(winnings > 0 ? "Green" : "Red");

    const doubleOrNothingRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("double_or_nothing")
        .setLabel("🎲 Double or Nothing")
        .setStyle(ButtonStyle.Success)
        .setDisabled(winnings <= 0),
    );

    await i.update({
      embeds: [resultEmbed],
      components: winnings > 0 ? [doubleOrNothingRow] : [],
    });

    if (winnings > 0) {
      accumulatedWinnings += winnings;
      await updateAccumulatedMessage();

      const doubleCollector = message.createMessageComponentCollector({
        filter: (btn) => btn.user.id === user.id && btn.customId === "double_or_nothing",
        time: 15000,
      });

      doubleCollector.on("collect", async (btn) => {
        doubleCollector.stop();

        const doubleResult = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)];
        const isDoubleWin = chosenColor?.toLowerCase() === doubleResult.color.toLowerCase();
        let doubleWinnings = 0;

        if (isDoubleWin) {
          doubleWinnings = winnings * 2;
          const finalBalance = await toFixedNumber(newBalance + winnings);
          await main.prisma.userEconomy.update({
            where: { id: userBalance.id },
            data: { balance: finalBalance },
          });

          const doubleWinEmbed = new EmbedCorrect()
            .setTitle("🎉 Double or Nothing Result")
            .setDescription(
              `The roulette stopped at **${doubleResult.color} ${doubleResult.number}**.\n\n` +
                `🎉 **You won $${doubleWinnings}!** Your new balance is **$${finalBalance}**.`,
            )
            .setColor("Green");

          await btn.update({
            embeds: [doubleWinEmbed],
            components: [],
          });
        } else {
          const finalBalance = await toFixedNumber(newBalance - winnings);
          await main.prisma.userEconomy.update({
            where: { id: userBalance.id },
            data: { balance: finalBalance },
          });

          const doubleLoseEmbed = new ErrorEmbed()
            .setTitle("💀 Double or Nothing Result")
            .setDescription(
              `The roulette stopped at **${doubleResult.color} ${doubleResult.number}**.\n\n` +
                `💀 **You lost everything!** Your new balance is **$${finalBalance}**.`,
            )
            .setColor("Red");

          await btn.update({
            embeds: [doubleLoseEmbed],
            components: [],
          });
        }
      });

      doubleCollector.on("end", async (_, reason) => {
        if (reason === "time") {
          await interaction.editReply({
            content: "⏳ Double or Nothing option expired.",
            components: [],
          });
        }
      });
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason === "time") {
      await interaction.editReply({
        content: "⏳ You didn't stop the roulette in time. The game has been canceled.",
        components: [],
      });
    }
  });

  return;
}
