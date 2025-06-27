"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="5fbd0c28-2280-524f-af2d-83927abf9ecb")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinflipCommand = CoinflipCommand;
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../shared/adapters/extends/embeds.extend");
const functions_1 = require("../functions");
async function CoinflipCommand(interaction, _client) {
    if (!interaction.guild || !interaction.channel)
        return;
    const user = interaction.user;
    const userBalance = await (0, functions_1.fetchBalance)(user.id, interaction.guild.id);
    const bet = interaction.options.getNumber("bet");
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
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("choose_heads").setLabel("🟡 Heads").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("choose_tails").setLabel("⚪ Tails").setStyle(discord_js_1.ButtonStyle.Primary));
    const embed = new embeds_extend_1.EmbedCorrect()
        .setTitle("🪙 Coinflip Game")
        .setDescription(`**Your Bet:** $${bet}\n\nChoose your side: 🟡 Heads or ⚪ Tails. You have 15 seconds to decide!`)
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
        const animEmbed = new embeds_extend_1.EmbedCorrect()
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
                let winnings = await (0, functions_1.toFixedNumber)(bet * 2);
                if (isSpecialWin) {
                    winnings = await (0, functions_1.toFixedNumber)(bet * 10);
                    resultMessage = `🎉 **Special Event!** The coin landed on **${coinResult === "heads" ? "🟡 Heads" : "⚪ Tails"}**.\nYou earned an incredible **$${winnings}** (x10)!`;
                    resultEmoji = "🌟";
                }
                else {
                    resultMessage = `🎉 **You won!** The coin landed on **${coinResult === "heads" ? "🟡 Heads" : "⚪ Tails"}**.\nYou earned **$${winnings}**!`;
                    resultEmoji = "🎉";
                }
                newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance + winnings);
                resultColor = "Green";
                if (isRiskMode) {
                    const riskEmbed = new embeds_extend_1.EmbedCorrect()
                        .setTitle("🔥 Risk Mode Activated!")
                        .setDescription(`You have entered **Risk Mode**! If you win **3 times in a row**, you will earn **x5 your bet**. Do you want to continue?`)
                        .setColor("Orange");
                    const riskRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("risk_continue").setLabel("Continue").setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId("risk_stop").setLabel("Stop").setStyle(discord_js_1.ButtonStyle.Danger));
                    await interaction.editReply({
                        embeds: [riskEmbed],
                        components: [riskRow],
                    });
                    const riskCollector = message.createMessageComponentCollector({
                        filter: (btn) => btn.user.id === user.id && ["risk_continue", "risk_stop"].includes(btn.customId),
                        time: 15000,
                    });
                    let winStreak = 1;
                    riskCollector.on("collect", async (btn) => {
                        if (btn.customId === "risk_stop") {
                            riskCollector.stop();
                            return btn.update({
                                content: "You have exited Risk Mode. Your winnings have been added to your balance.",
                                components: [],
                            });
                        }
                        const nextResult = Math.random() < 0.5 ? "heads" : "tails";
                        const nextWin = choice === nextResult;
                        if (nextWin) {
                            winStreak++;
                            if (winStreak === 3) {
                                const riskWinnings = await (0, functions_1.toFixedNumber)(bet * 5);
                                newBalance = await (0, functions_1.toFixedNumber)(newBalance + riskWinnings);
                                await main_1.main.prisma.userEconomy.update({
                                    where: { id: userBalance.id },
                                    data: { balance: newBalance },
                                });
                                return btn.update({
                                    embeds: [
                                        new embeds_extend_1.EmbedCorrect()
                                            .setTitle("🔥 Risk Mode Success!")
                                            .setDescription(`You won **3 times in a row**! You earned an additional **$${riskWinnings}** (x5). Your new balance is **$${newBalance}**.`)
                                            .setColor("Green"),
                                    ],
                                    components: [],
                                });
                            }
                            else {
                                return btn.update({
                                    content: `You won this round! Current streak: **${winStreak}/3**. Keep going!`,
                                    components: [riskRow],
                                });
                            }
                        }
                        else {
                            riskCollector.stop();
                            newBalance = await (0, functions_1.toFixedNumber)(newBalance - bet);
                            await main_1.main.prisma.userEconomy.update({
                                where: { id: userBalance.id },
                                data: { balance: newBalance },
                            });
                            return btn.update({
                                embeds: [
                                    new embeds_extend_1.ErrorEmbed()
                                        .setTitle("💀 Risk Mode Failed!")
                                        .setDescription(`You lost during Risk Mode. Your new balance is **$${newBalance}**. Better luck next time!`)
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
            }
            else if (isExtremeLoss) {
                const loss = await (0, functions_1.toFixedNumber)(bet * 4);
                newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance - loss);
                resultMessage = `💀 **Extreme Loss!** The coin landed on **${coinResult === "heads" ? "🟡 Heads" : "⚪ Tails"}**.\nYou lost **$${loss}**!`;
                resultColor = "Red";
                resultEmoji = "😱";
            }
            else {
                newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance - bet);
                resultMessage = `😢 **You lost!** The coin landed on **${coinResult === "heads" ? "🟡 Heads" : "⚪ Tails"}**.\nYou lost **$${bet}**.`;
                resultColor = "Red";
                resultEmoji = "😢";
            }
            await main_1.main.prisma.userEconomy.update({
                where: { id: userBalance.id },
                data: { balance: newBalance },
            });
            const resultEmbed = new embeds_extend_1.EmbedCorrect()
                .setTitle(`${resultEmoji} Coinflip Result`)
                .setDescription(`${resultMessage}\n\n**New Balance:** $${newBalance}`)
                .setColor(resultColor);
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
//# sourceMappingURL=coinflip.js.map
//# debugId=5fbd0c28-2280-524f-af2d-83927abf9ecb
