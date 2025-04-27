"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DueloCommand = DueloCommand;
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../main");
const embeds_extender_1 = require("../../../../../structure/extenders/discord/embeds.extender");
const functions_1 = require("../functions");
async function DueloCommand(interaction, _client) {
    if (!interaction.guild || !interaction.channel)
        return;
    const challenger = interaction.user;
    const opponent = interaction.options.getUser("user");
    const bet = interaction.options.getNumber("bet");
    if (!opponent || opponent.bot || opponent.id === challenger.id) {
        return interaction.reply({
            embeds: [
                new embeds_extender_1.ErrorEmbed().setDescription("You must mention a valid user to challenge to a duel."),
            ],
            flags: "Ephemeral",
        });
    }
    if (!bet || bet < 500) {
        return interaction.reply({
            embeds: [new embeds_extender_1.ErrorEmbed().setDescription("The minimum bet for a duel is $500.")],
            flags: "Ephemeral",
        });
    }
    const challengerBalance = await (0, functions_1.fetchBalance)(challenger.id, interaction.guild.id);
    const opponentBalance = await (0, functions_1.fetchBalance)(opponent.id, interaction.guild.id);
    if (challengerBalance.balance < bet || opponentBalance.balance < bet) {
        return interaction.reply({
            embeds: [
                new embeds_extender_1.ErrorEmbed().setDescription("Both users must have enough balance to cover the bet."),
            ],
            flags: "Ephemeral",
        });
    }
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("accept_duel")
        .setLabel("Accept Duel")
        .setStyle(discord_js_1.ButtonStyle.Success));
    const duelMessage = await interaction.reply({
        content: `${opponent}, you have been challenged to a duel by ${challenger} with a bet of $${bet}. Do you accept?`,
        components: [row],
        ephemeral: false,
    });
    const collector = duelMessage.createMessageComponentCollector({
        filter: (i) => i.user.id === opponent.id && i.customId === "accept_duel",
        time: 10000,
    });
    collector.on("collect", async (i) => {
        collector.stop();
        let challengerHP = 1000;
        let opponentHP = 1000;
        const getHealthBar = (hp) => {
            const totalBars = 20;
            const filledBars = Math.round((hp / 1000) * totalBars);
            const emptyBars = totalBars - filledBars;
            return "🟥".repeat(filledBars) + "⬜".repeat(emptyBars);
        };
        const updateDuelMessage = async () => {
            await i.update({
                embeds: [
                    new embeds_extender_1.EmbedCorrect()
                        .setTitle("⚔️ Duel in Progress")
                        .setDescription(`🤺 **${challenger.username}**: ❤️ ${challengerHP}\n${getHealthBar(challengerHP)}\n\n` +
                        `🛡️ **${opponent.username}**: ❤️ ${opponentHP}\n${getHealthBar(opponentHP)}`)
                        .setColor("Orange"),
                ],
                components: [actionRow],
            });
        };
        const actionRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("attack").setLabel("Attack ⚔️").setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId("defend").setLabel("Defend 🛡️").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setCustomId("boost_attack")
            .setLabel("Boost Attack x10 ($100)")
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        let currentPlayer = challenger;
        const duelCollector = i.channel?.createMessageComponentCollector({
            filter: (btn) => [challenger.id, opponent.id].includes(btn.user.id) &&
                ["attack", "defend", "boost_attack"].includes(btn.customId),
            time: 30000, // 30 seconds of inactivity
        });
        duelCollector?.on("collect", async (btn) => {
            if (btn.user.id !== currentPlayer.id) {
                return btn.reply({
                    content: "It's not your turn.",
                    flags: "Ephemeral",
                });
            }
            const action = btn.customId;
            const damage = Math.floor(Math.random() * 100) + 50;
            const defense = Math.floor(Math.random() * 50) + 25;
            if (action === "boost_attack") {
                if (!interaction.guild)
                    return;
                const playerBalance = await (0, functions_1.fetchBalance)(currentPlayer.id, interaction.guild.id);
                if (playerBalance.balance < 100) {
                    return btn.reply({
                        content: "You don't have enough money to boost your attack.",
                        flags: "Ephemeral",
                    });
                }
                await main_1.main.prisma.userEconomy.update({
                    where: { id: playerBalance.id },
                    data: { balance: playerBalance.balance - 100 },
                });
                if (currentPlayer.id === challenger.id) {
                    opponentHP -= damage * 10;
                }
                else {
                    challengerHP -= damage * 10;
                }
                await btn.reply({
                    content: "Your next attack was boosted by x10!",
                    flags: "Ephemeral",
                });
            }
            else if (action === "attack") {
                if (currentPlayer.id === challenger.id) {
                    opponentHP -= damage;
                }
                else {
                    challengerHP -= damage;
                }
            }
            else if (action === "defend") {
                if (currentPlayer.id === challenger.id) {
                    challengerHP += defense;
                }
                else {
                    opponentHP += defense;
                }
            }
            currentPlayer = currentPlayer.id === challenger.id ? opponent : challenger;
            if (!interaction.guild)
                return;
            if (challengerHP <= 0 || opponentHP <= 0) {
                duelCollector.stop();
                const winner = challengerHP > 0 ? challenger : opponent;
                const loser = challengerHP > 0 ? opponent : challenger;
                const totalBet = bet * 2;
                const winnerBalance = await (0, functions_1.toFixedNumber)((await (0, functions_1.fetchBalance)(winner.id, interaction.guild.id)).balance + totalBet);
                const loserBalance = await (0, functions_1.toFixedNumber)((await (0, functions_1.fetchBalance)(loser.id, interaction.guild.id)).balance - bet);
                const winnerEconomy = await (0, functions_1.fetchBalance)(winner.id, interaction.guild.id);
                const loserEconomy = await (0, functions_1.fetchBalance)(loser.id, interaction.guild.id);
                await main_1.main.prisma.userEconomy.update({
                    where: { id: winnerEconomy.id },
                    data: {
                        balance: winnerBalance,
                        wonduels: (winnerEconomy.wonduels || 0) + 1,
                    },
                });
                await main_1.main.prisma.userEconomy.update({
                    where: { id: loserEconomy.id },
                    data: {
                        balance: loserBalance,
                        lostduels: (loserEconomy.lostduels || 0) + 1,
                    },
                });
                return i.editReply({
                    embeds: [
                        new embeds_extender_1.EmbedCorrect()
                            .setTitle("🏆 Duel Finished")
                            .setDescription(`**Winner:** ${winner.username}\n**Loser:** ${loser.username}\n**Total Winnings:** $${totalBet}`)
                            .setColor("Green"),
                    ],
                    components: [],
                });
            }
            return await updateDuelMessage();
        });
        duelCollector?.on("end", async (_, reason) => {
            if (reason === "time") {
                await i.editReply({
                    content: "💥 The duel exploded due to inactivity. Both players lose!",
                    components: [],
                });
            }
        });
        await updateDuelMessage();
    });
    collector.on("end", async (_, reason) => {
        if (reason === "time") {
            await interaction.editReply({
                content: "The duel was canceled because it was not accepted in time.",
                components: [],
            });
        }
    });
    return;
}
