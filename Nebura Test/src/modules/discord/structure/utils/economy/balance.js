"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceCommand = void 0;
const discord_js_1 = require("discord.js");
const embeds_extender_1 = require("../../../../../structure/extenders/discord/embeds.extender");
const functions_1 = require("../functions");
exports.BalanceCommand = {
    Interaction: async (interaction, client) => {
        if (!interaction.guild || !interaction.channel)
            return;
        const user = interaction.options.getUser("user") || interaction.user;
        const dbBalance = await (0, functions_1.getBalance)(user.id, interaction.guild.id);
        if (!dbBalance) {
            return await interaction.reply({
                embeds: [
                    new embeds_extender_1.EmbedCorrect().setDescription([
                        `${client.getEmoji(interaction.guild.id, "error")} **${user.username}** does not have an account yet!`,
                        `Use \`/register\` to create an account!`,
                    ].join("\n")),
                ],
                flags: "Ephemeral",
            });
        }
        return await interaction.reply({
            embeds: [
                new embeds_extender_1.EmbedCorrect()
                    .setTitle(`${user.username}'s Balance`)
                    .setDescription(`**User has $${dbBalance.balance}**`),
            ],
        });
    },
    Message: async (message, client) => {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const user = message.mentions.users.first() || message.author;
        const dbBalance = await (0, functions_1.getBalance)(user.id, message.guild.id);
        if (!dbBalance) {
            return await message.channel.send({
                embeds: [
                    new embeds_extender_1.EmbedCorrect().setDescription([
                        `${client.getEmoji(message.guild.id, "error")} **${user.username}** does not have an account yet!`,
                        `Use \`/register\` to create an account!`,
                    ].join("\n")),
                ],
            });
        }
        return await message.channel.send({
            embeds: [
                new embeds_extender_1.EmbedCorrect()
                    .setTitle(`${user.username}'s Balance`)
                    .setDescription(`**User has $${dbBalance.balance}**`),
            ],
        });
    },
};
