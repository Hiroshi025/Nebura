"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="91813e97-a0be-5a4d-b616-4e24b3b99ccf")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyCommand = void 0;
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../shared/adapters/extends/embeds.extend");
const functions_1 = require("../functions");
exports.DailyCommand = {
    Interaction: async (interaction, _client) => {
        if (!interaction.guild || !interaction.channel)
            return;
        const user = interaction.user;
        const userBalance = await (0, functions_1.fetchBalance)(user.id, interaction.guild.id);
        const chosenCard = interaction.options.getString("card");
        if (!chosenCard || !["1", "2", "3", "4"].includes(chosenCard)) {
            return interaction.reply({
                embeds: [new embeds_extend_1.ErrorEmbed().setDescription("You must choose a card between `1`, `2`, `3`, or `4` to play!")],
                flags: "Ephemeral",
            });
        }
        const randomCard = Math.floor(Math.random() * 4) + 1;
        if (parseInt(chosenCard) === randomCard) {
            const newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance + 50);
            await main_1.main.prisma.userEconomy.update({
                where: { id: userBalance.id },
                data: { balance: newBalance },
            });
            return interaction.reply({
                embeds: [
                    new embeds_extend_1.EmbedCorrect()
                        .setDescription(`🎉 Congratulations! You chose card **${chosenCard}**, and the correct card was **${randomCard}**. You won **$50**!`)
                        .setColor("Green"),
                ],
                flags: "Ephemeral",
            });
        }
        else {
            const newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance - 10);
            await main_1.main.prisma.userEconomy.update({
                where: { id: userBalance.id },
                data: { balance: newBalance },
            });
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("daily_x10").setLabel("Bet x10").setStyle(discord_js_1.ButtonStyle.Danger));
            await interaction.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setDescription(`😢 You chose card **${chosenCard}**, but the correct card was **${randomCard}**. You lost **$10**. Want to bet x10?`)
                        .setColor("Red"),
                ],
                components: [row],
                flags: "Ephemeral",
            });
            const collector = interaction.channel?.createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id && i.customId === "daily_x10",
                time: 10000,
            });
            collector?.on("collect", async (i) => {
                collector.stop();
                const x10RandomCard = Math.floor(Math.random() * 4) + 1;
                if (parseInt(chosenCard) === x10RandomCard) {
                    const x10NewBalance = await (0, functions_1.toFixedNumber)(userBalance.balance + 500);
                    await main_1.main.prisma.userEconomy.update({
                        where: { id: userBalance.id },
                        data: { balance: x10NewBalance },
                    });
                    await i.update({
                        embeds: [
                            new embeds_extend_1.EmbedCorrect()
                                .setDescription(`🎉 Amazing! You chose card **${chosenCard}**, and the correct card was **${x10RandomCard}**. You won **$500**!`)
                                .setColor("Green"),
                        ],
                        components: [],
                    });
                }
                else {
                    const x10NewBalance = await (0, functions_1.toFixedNumber)(userBalance.balance - 100);
                    await main_1.main.prisma.userEconomy.update({
                        where: { id: userBalance.id },
                        data: { balance: x10NewBalance },
                    });
                    await i.update({
                        embeds: [
                            new embeds_extend_1.ErrorEmbed()
                                .setDescription(`😢 You chose card **${chosenCard}**, but the correct card was **${x10RandomCard}**. You lost **$100**. Better luck next time!`)
                                .setColor("Red"),
                        ],
                        components: [],
                    });
                }
            });
            collector?.on("end", async (_, reason) => {
                if (reason === "time") {
                    await interaction.editReply({
                        components: [],
                    });
                }
            });
        }
        return;
    },
    Message: async (message, _client, args) => {
        if (!message.guild || !message.channel || !message.member)
            return;
        const user = message.author;
        const userBalance = await (0, functions_1.fetchBalance)(user.id, message.guild.id);
        const chosenCard = args[0];
        if (!chosenCard || !["1", "2", "3", "4"].includes(chosenCard)) {
            return message.reply({
                embeds: [new embeds_extend_1.ErrorEmbed().setDescription("You must choose a card between `1`, `2`, `3`, or `4` to play!")],
            });
        }
        const randomCard = Math.floor(Math.random() * 4) + 1;
        if (parseInt(chosenCard) === randomCard) {
            const newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance + 50);
            await main_1.main.prisma.userEconomy.update({
                where: { id: userBalance.id },
                data: { balance: newBalance },
            });
            return message.reply({
                embeds: [
                    new embeds_extend_1.EmbedCorrect()
                        .setDescription(`🎉 Congratulations! You chose card **${chosenCard}**, and the correct card was **${randomCard}**. You won **$50**!`)
                        .setColor("Green"),
                ],
            });
        }
        else {
            const newBalance = await (0, functions_1.toFixedNumber)(userBalance.balance - 10);
            await main_1.main.prisma.userEconomy.update({
                where: { id: userBalance.id },
                data: { balance: newBalance },
            });
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("daily_x10").setLabel("Bet x10").setStyle(discord_js_1.ButtonStyle.Danger));
            const reply = await message.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setDescription(`😢 You chose card **${chosenCard}**, but the correct card was **${randomCard}**. You lost **$10**. Want to bet x10?`)
                        .setColor("Red"),
                ],
                components: [row],
            });
            const collector = reply.createMessageComponentCollector({
                filter: (i) => i.user.id === message.author.id && i.customId === "daily_x10",
                time: 10000,
            });
            collector?.on("collect", async (i) => {
                collector.stop();
                const x10RandomCard = Math.floor(Math.random() * 4) + 1;
                if (parseInt(chosenCard) === x10RandomCard) {
                    const x10NewBalance = await (0, functions_1.toFixedNumber)(userBalance.balance + 500);
                    await main_1.main.prisma.userEconomy.update({
                        where: { id: userBalance.id },
                        data: { balance: x10NewBalance },
                    });
                    await i.update({
                        embeds: [
                            new embeds_extend_1.EmbedCorrect()
                                .setDescription(`🎉 Amazing! You chose card **${chosenCard}**, and the correct card was **${x10RandomCard}**. You won **$500**!`)
                                .setColor("Green"),
                        ],
                        components: [],
                    });
                }
                else {
                    const x10NewBalance = await (0, functions_1.toFixedNumber)(userBalance.balance - 100);
                    await main_1.main.prisma.userEconomy.update({
                        where: { id: userBalance.id },
                        data: { balance: x10NewBalance },
                    });
                    await i.update({
                        embeds: [
                            new embeds_extend_1.ErrorEmbed()
                                .setDescription(`😢 You chose card **${chosenCard}**, but the correct card was **${x10RandomCard}**. You lost **$100**. Better luck next time!`)
                                .setColor("Red"),
                        ],
                        components: [],
                    });
                }
            });
            collector?.on("end", async (_, reason) => {
                if (reason === "time") {
                    await reply.edit({
                        components: [],
                    });
                }
            });
        }
        return;
    },
};
//# sourceMappingURL=daily.js.map
//# debugId=91813e97-a0be-5a4d-b616-4e24b3b99ccf
