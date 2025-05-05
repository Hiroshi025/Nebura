import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@extenders/discord/embeds.extender";

import { MyClient } from "../../../client";
import { fetchBalance, toFixedNumber } from "../functions";

export async function CoinflipCommand(interaction: ChatInputCommandInteraction, _client: MyClient) {
  if (!interaction.guild || !interaction.channel) return;

  const user = interaction.user;
  const userBalance = await fetchBalance(user.id, interaction.guild.id);

  const bet = interaction.options.getNumber("bet");

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

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("choose_heads")
      .setLabel("🟡 Heads")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("choose_tails")
      .setLabel("⚪ Tails")
      .setStyle(ButtonStyle.Primary),
  );

  const embed = new EmbedCorrect()
    .setTitle("🪙 Coinflip Game")
    .setDescription(
      `**Your Bet:** $${bet}\n\nChoose your side: 🟡 Heads or ⚪ Tails. You have 15 seconds to decide!`,
    )
    .setColor("Orange");

  const message = await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: false,
  });

  const collector = message.createMessageComponentCollector({
    filter: (i) => i.user.id === user.id && ["choose_heads", "choose_tails"].includes(i.customId),
    time: 15000,
  });

  collector.on("collect", async (i) => {
    collector.stop();

    const choice = i.customId === "choose_heads" ? "heads" : "tails";
    //const choiceEmoji = choice === "heads" ? "🟡 Heads" : "⚪ Tails";

    const animEmbed = new EmbedCorrect()
      .setTitle("🪙 Flipping the Coin...")
      .setDescription("Flipping the coin... ⏳")
      .setColor("Yellow");

    await i.update({
      embeds: [animEmbed],
      components: [],
    });

    setTimeout(async () => {
      const coinResult = Math.random() < 0.5 ? "heads" : "tails";
      const isWin = choice === coinResult;
      const isExtremeLoss = !isWin && Math.random() < 0.1;
      const isSpecialWin = isWin && Math.random() < 0.01; // 1% chance for 10x
      const isRiskMode = Math.random() < 0.05; // 5% chance to trigger Risk Mode

      let newBalance = userBalance.balance;
      let resultMessage = "";
      let resultColor = "";
      let resultEmoji = "";

      if (isWin) {
        let winnings = await toFixedNumber(bet * 2);
        if (isSpecialWin) {
          winnings = await toFixedNumber(bet * 10);
          resultMessage = `🎉 **Special Event!** The coin landed on **${coinResult === "heads" ? "🟡 Heads" : "⚪ Tails"}**.\nYou earned an incredible **$${winnings}** (x10)!`;
          resultEmoji = "🌟";
        } else {
          resultMessage = `🎉 **You won!** The coin landed on **${coinResult === "heads" ? "🟡 Heads" : "⚪ Tails"}**.\nYou earned **$${winnings}**!`;
          resultEmoji = "🎉";
        }
        newBalance = await toFixedNumber(userBalance.balance + winnings);
        resultColor = "Green";

        if (isRiskMode) {
          const riskEmbed = new EmbedCorrect()
            .setTitle("🔥 Risk Mode Activated!")
            .setDescription(
              `You have entered **Risk Mode**! If you win **3 times in a row**, you will earn **x5 your bet**. Do you want to continue?`,
            )
            .setColor("Orange");

          const riskRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("risk_continue")
              .setLabel("Continue")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId("risk_stop")
              .setLabel("Stop")
              .setStyle(ButtonStyle.Danger),
          );

          await interaction.editReply({
            embeds: [riskEmbed],
            components: [riskRow],
          });

          const riskCollector = message.createMessageComponentCollector({
            filter: (btn) =>
              btn.user.id === user.id && ["risk_continue", "risk_stop"].includes(btn.customId),
            time: 15000,
          });

          let winStreak = 1;

          riskCollector.on("collect", async (btn) => {
            if (btn.customId === "risk_stop") {
              riskCollector.stop();
              return btn.update({
                content:
                  "You have exited Risk Mode. Your winnings have been added to your balance.",
                components: [],
              });
            }

            const nextResult = Math.random() < 0.5 ? "heads" : "tails";
            const nextWin = choice === nextResult;

            if (nextWin) {
              winStreak++;
              if (winStreak === 3) {
                const riskWinnings = await toFixedNumber(bet * 5);
                newBalance = await toFixedNumber(newBalance + riskWinnings);
                await main.prisma.userEconomy.update({
                  where: { id: userBalance.id },
                  data: { balance: newBalance },
                });

                return btn.update({
                  embeds: [
                    new EmbedCorrect()
                      .setTitle("🔥 Risk Mode Success!")
                      .setDescription(
                        `You won **3 times in a row**! You earned an additional **$${riskWinnings}** (x5). Your new balance is **$${newBalance}**.`,
                      )
                      .setColor("Green"),
                  ],
                  components: [],
                });
              } else {
                return btn.update({
                  content: `You won this round! Current streak: **${winStreak}/3**. Keep going!`,
                  components: [riskRow],
                });
              }
            } else {
              riskCollector.stop();
              newBalance = await toFixedNumber(newBalance - bet);
              await main.prisma.userEconomy.update({
                where: { id: userBalance.id },
                data: { balance: newBalance },
              });

              return btn.update({
                embeds: [
                  new ErrorEmbed()
                    .setTitle("💀 Risk Mode Failed!")
                    .setDescription(
                      `You lost during Risk Mode. Your new balance is **$${newBalance}**. Better luck next time!`,
                    )
                    .setColor("Red"),
                ],
                components: [],
              });
            }
          });

          riskCollector.on("end", async (_, reason) => {
            if (reason === "time") {
              await interaction.editReply({
                content: "Risk Mode has expired due to inactivity.",
                components: [],
              });
            }
          });

          return;
        }
      } else if (isExtremeLoss) {
        const loss = await toFixedNumber(bet * 4);
        newBalance = await toFixedNumber(userBalance.balance - loss);
        resultMessage = `💀 **Extreme Loss!** The coin landed on **${coinResult === "heads" ? "🟡 Heads" : "⚪ Tails"}**.\nYou lost **$${loss}**!`;
        resultColor = "Red";
        resultEmoji = "😱";
      } else {
        newBalance = await toFixedNumber(userBalance.balance - bet);
        resultMessage = `😢 **You lost!** The coin landed on **${coinResult === "heads" ? "🟡 Heads" : "⚪ Tails"}**.\nYou lost **$${bet}**.`;
        resultColor = "Red";
        resultEmoji = "😢";
      }

      await main.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: newBalance },
      });

      const resultEmbed = new EmbedCorrect()
        .setTitle(`${resultEmoji} Coinflip Result`)
        .setDescription(`${resultMessage}\n\n**New Balance:** $${newBalance}`)
        .setColor(resultColor as ColorResolvable);

      await interaction.editReply({
        embeds: [resultEmbed],
        components: [],
      });
    }, 3000); // Simulates coin flip animation.
  });

  collector.on("end", async (_, reason) => {
    if (reason === "time") {
      await interaction.editReply({
        content: "⏳ You didn't choose a side in time. The game has been canceled.",
        components: [],
      });
    }
  });

  return;
}
