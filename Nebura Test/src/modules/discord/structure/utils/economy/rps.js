"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPSCommand = RPSCommand;
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../main");
const embeds_extender_1 = require("../../../../../structure/extenders/discord/embeds.extender");
const functions_1 = require("../functions");
async function RPSCommand(interaction, _client) {
    if (!interaction.guild || !interaction.channel)
        return;
    const challenger = interaction.user;
    const opponent = interaction.options.getUser("user");
    const bet = interaction.options.getNumber("bet");
    if (!bet || bet < 200) {
        return interaction.reply({
            embeds: [
                new embeds_extender_1.ErrorEmbed().setDescription("The minimum bet for Rock, Paper, Scissors is $200."),
            ],
            flags: "Ephemeral",
        });
    }
    const challengerBalance = await (0, functions_1.fetchBalance)(challenger.id, interaction.guild.id);
    if (bet > challengerBalance.balance) {
        return interaction.reply({
            embeds: [
                new embeds_extender_1.ErrorEmbed().setDescription(`You don't have enough balance to place this bet! Your current balance is $${challengerBalance.balance}.`),
            ],
            flags: "Ephemeral",
        });
    }
    if (opponent) {
        if (opponent.bot || opponent.id === challenger.id) {
            return interaction.reply({
                embeds: [new embeds_extender_1.ErrorEmbed().setDescription("You must mention a valid user to challenge.")],
                flags: "Ephemeral",
            });
        }
        const opponentBalance = await (0, functions_1.fetchBalance)(opponent.id, interaction.guild.id);
        if (bet > opponentBalance.balance) {
            return interaction.reply({
                embeds: [
                    new embeds_extender_1.ErrorEmbed().setDescription(`The opponent doesn't have enough balance to accept this bet! Their current balance is $${opponentBalance.balance}.`),
                ],
                flags: "Ephemeral",
            });
        }
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("accept_rps")
            .setLabel("Accept")
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId("reject_rps").setLabel("Reject").setStyle(discord_js_1.ButtonStyle.Danger));
        const challengeMessage = await interaction.reply({
            content: `${opponent}, you have been challenged to a Rock, Paper, Scissors game by ${challenger} with a bet of $${bet}. Do you accept?`,
            components: [row],
            ephemeral: false,
        });
        const collector = challengeMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === opponent.id && ["accept_rps", "reject_rps"].includes(i.customId),
            time: 15000,
        });
        collector.on("collect", async (i) => {
            collector.stop();
            if (i.customId === "reject_rps") {
                return i.update({
                    content: "The challenge was rejected.",
                    components: [],
                });
            }
            await startGame(interaction, challenger, opponent, bet);
            return;
        });
        collector.on("end", async (_, reason) => {
            if (reason === "time") {
                await interaction.editReply({
                    content: "The challenge was not accepted in time.",
                    components: [],
                });
            }
        });
    }
    else {
        await startGame(interaction, challenger, null, bet);
    }
    return;
}
async function startGame(interaction, challenger, opponent, bet) {
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("rock").setLabel("🪨 Rock").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("paper").setLabel("📄 Paper").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId("scissors")
        .setLabel("✂️ Scissors")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("forfeit").setLabel("🚪 Forfeit").setStyle(discord_js_1.ButtonStyle.Danger));
    const players = opponent ? [opponent, challenger] : [challenger];
    let currentPlayerIndex = 0;
    const choices = {};
    const gameMessage = await interaction.reply({
        content: `${players[currentPlayerIndex]}, it's your turn! Choose your move.`,
        components: [row],
        ephemeral: false,
    });
    const collector = gameMessage.createMessageComponentCollector({
        filter: (i) => players.some((p) => p.id === i.user.id) &&
            ["rock", "paper", "scissors", "forfeit"].includes(i.customId),
        time: 30000,
    });
    collector.on("collect", async (i) => {
        if (i.user.id !== players[currentPlayerIndex].id) {
            return i.reply({
                content: "It's not your turn.",
                flags: "Ephemeral",
            });
        }
        if (i.customId === "forfeit") {
            collector.stop();
            const winner = players[1 - currentPlayerIndex];
            const loser = players[currentPlayerIndex];
            await handleResult(interaction, winner, loser, bet, true);
            return;
        }
        choices[i.user.id] = i.customId;
        currentPlayerIndex++;
        if (currentPlayerIndex >= players.length) {
            collector.stop();
            const winner = determineWinner(choices, players);
            const loser = players.find((p) => p.id !== winner.id);
            await handleResult(interaction, winner, loser, bet, false);
        }
        else {
            await i.update({
                content: `${players[currentPlayerIndex]}, it's your turn! Choose your move.`,
                components: [row],
            });
        }
        return;
    });
    collector.on("end", async (_, reason) => {
        if (reason === "time") {
            await interaction.editReply({
                content: "The game ended due to inactivity.",
                components: [],
            });
        }
    });
}
function determineWinner(choices, players) {
    const [player1, player2] = players;
    const choice1 = choices[player1.id];
    const choice2 = choices[player2.id];
    if (choice1 === choice2)
        return null;
    if ((choice1 === "rock" && choice2 === "scissors") ||
        (choice1 === "paper" && choice2 === "rock") ||
        (choice1 === "scissors" && choice2 === "paper")) {
        return player1;
    }
    return player2;
}
async function handleResult(interaction, winner, loser, bet, forfeit) {
    if (!interaction.guild)
        return;
    const winnerBalance = await (0, functions_1.fetchBalance)(winner.id, interaction.guild.id);
    const loserBalance = await (0, functions_1.fetchBalance)(loser.id, interaction.guild.id);
    const totalWinnings = forfeit ? bet : bet * 2;
    await main_1.main.prisma.userEconomy.update({
        where: { id: winnerBalance.id },
        data: { balance: winnerBalance.balance + totalWinnings },
    });
    await main_1.main.prisma.userEconomy.update({
        where: { id: loserBalance.id },
        data: { balance: loserBalance.balance - bet },
    });
    await interaction.editReply({
        embeds: [
            new embeds_extender_1.EmbedCorrect()
                .setTitle(forfeit ? "🚪 Forfeit!" : "🏆 Game Over!")
                .setDescription(forfeit
                ? `${loser.username} forfeited the game. ${winner.username} wins $${totalWinnings}!`
                : `${winner.username} wins $${totalWinnings}! Better luck next time, ${loser.username}.`)
                .setColor("Green"),
        ],
        components: [],
    });
}
