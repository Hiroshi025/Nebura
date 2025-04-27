"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobCommand = void 0;
const main_1 = require("../../../../../main");
const embeds_extender_1 = require("../../../../../structure/extenders/discord/embeds.extender");
const functions_1 = require("../functions");
exports.RobCommand = {
    Message: async (message, client, args) => {
        if (!message.guild || !message.channel || !message.member)
            return;
        const user = message.mentions.users.first() || message.guild.members.cache.get(args[0])?.user;
        if (!user) {
            return message.reply({
                embeds: [new embeds_extender_1.ErrorEmbed().setDescription("Please mention a user to rob!")],
            });
        }
        const userBalance = await (0, functions_1.fetchBalance)(user?.id, message.guild.id);
        const robChance = Math.floor(Math.random() * 100) + 1;
        const robAmount = Math.floor(Math.random() * userBalance.balance) + 1;
        if (robChance > 50) {
            await main_1.main.prisma.userEconomy.update({
                where: { id: userBalance.id },
                data: { balance: userBalance.balance - robAmount },
            });
            await main_1.main.prisma.userEconomy.update({
                where: { id: userBalance.id },
                data: { balance: userBalance.balance + robAmount },
            });
            return message.reply({
                embeds: [
                    new embeds_extender_1.EmbedCorrect().setDescription([
                        `${client.getEmoji(message.guild.id, "success")} You successfully robbed ${user}!`,
                        `You stole $${robAmount} from them.`,
                    ].join("\n")),
                ],
            });
        }
        else {
            return message.reply({
                embeds: [
                    new embeds_extender_1.ErrorEmbed().setDescription([
                        `${client.getEmoji(message.guild.id, "error")} You failed to rob ${user}!`,
                        `You lost $${robAmount} in the process.`,
                    ].join("\n")),
                ],
            });
        }
    },
};
