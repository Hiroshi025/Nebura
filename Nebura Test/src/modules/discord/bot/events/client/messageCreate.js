"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../../../../../main");
const functions_1 = require("../../../../../modules/discord/structure/utils/functions");
const config_1 = require("../../../../../shared/utils/config");
const embeds_extender_1 = require("../../../../../structure/extenders/discord/embeds.extender");
const builders_1 = require("../../../structure/utils/builders");
exports.default = new builders_1.Event("messageCreate", async (message) => {
    if (!message.guild || !message.channel || message.author.bot || !main_1.client.user)
        return;
    await (0, functions_1.createGuild)(message.guild.id, main_1.client);
    await (0, functions_1.createUser)(message.author.id);
    await (0, functions_1.Ranking)(message, main_1.client);
    await (0, functions_1.Economy)(message);
    if (!message.content.startsWith(config_1.config.modules.discord.prefix))
        return;
    const language = message.guild.preferredLocale;
    const data = await main_1.main.prisma.userDiscord.findFirst({
        where: {
            userId: message.author.id,
        },
    });
    await (0, functions_1.countMessage)(message.author.id, message.guild.id);
    const args = message.content
        .slice(config_1.config.modules.discord.prefix.length)
        .trim()
        .split(/\s+/);
    const cmd = args.shift()?.toLowerCase() ?? "";
    if (!cmd || !data)
        return;
    const command = main_1.client.precommands.get(cmd) ||
        main_1.client.precommands.find((c) => c?.aliases?.includes(cmd));
    if (!command)
        return;
    try {
        if (command.owner && !config_1.config.modules.discord.owners.includes(message.author.id)) {
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed().setDescription([
                        `${main_1.client.getEmoji(message.guild.id, "error")} You do not have permission to use this command as it is reserved for the bot owner.`,
                        `If you believe this is a mistake, please contact the bot owner.`,
                    ].join("\n")),
                ],
            });
        }
        if (command.nsfw && !message.channel.nsfw) {
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Pixel Web - Bot Core")
                        .setDescription([
                        `${main_1.client.getEmoji(message.guild.id, "error")} You can only use this command in a NSFW channel.`,
                        `If you believe this is a mistake, please contact the server staff.`,
                    ].join("\n")),
                ],
            });
        }
        if (command.permissions && !message.member?.permissions.has(command.permissions)) {
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Pixel Web - Bot Core")
                        .setDescription([
                        `${main_1.client.getEmoji(message.guild.id, "error")} You do not have permission to use this command.`,
                        `If you believe this is a mistake, please contact the server staff.`,
                    ].join("\n")),
                ],
            });
        }
        if (command.botpermissions &&
            !message.guild.members.me?.permissions.has(command.botpermissions)) {
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Pixel Web - Bot Core")
                        .setDescription([
                        `${main_1.client.getEmoji(message.guild.id, "error")} I do not have permission to execute this command.`,
                        `If you believe this is a mistake, please contact the server staff.`,
                    ].join("\n")),
                ],
            });
        }
        if (command.cooldown) {
            const cooldown = main_1.client.cooldown.get(command.name) || new Map();
            const now = Date.now();
            const cooldownAmount = command.cooldown * 1000;
            if (cooldown.has(message.author.id)) {
                const expirationTime = cooldown.get(message.author.id) + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = Math.round((expirationTime - now) / 1000);
                    return message.channel.send({
                        embeds: [
                            new embeds_extender_1.ErrorEmbed()
                                .setTitle("Pixel Web - Bot Core")
                                .setDescription([
                                `${main_1.client.getEmoji(message.guild.id, "error")} You are on cooldown for this command.`,
                                `Please wait ${timeLeft} seconds before using it again.`,
                            ].join("\n")),
                        ],
                    });
                }
            }
            cooldown.set(message.author.id, now);
            main_1.client.cooldown.set(command.name, cooldown);
        }
        await command.execute(main_1.client, message, args, config_1.config.modules.discord.prefix, language, config_1.config);
    }
    catch (error) {
        const errorEmbed = new embeds_extender_1.ErrorEmbed()
            .setError(true)
            .setTitle("Command Execution Error")
            .setErrorFormat(`An error occurred while executing the command: ${command.name}`, error);
        await message.channel.send({ embeds: [errorEmbed] });
    }
    return;
});
