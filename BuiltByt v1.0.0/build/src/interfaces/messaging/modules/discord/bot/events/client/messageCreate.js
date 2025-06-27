"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="379058af-85e6-569f-8ebe-be132fcb52c7")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("../../../../../../../interfaces/messaging/modules/discord/structure/utils/functions");
const main_1 = require("../../../../../../../main");
const embeds_extend_1 = require("../../../../../../../shared/adapters/extends/embeds.extend");
const config_1 = require("../../../../../../../shared/utils/config");
const helpers_1 = require("../../../../discord/structure/utils/ranking/helpers");
const builders_1 = require("../../../structure/utils/builders");
function escapeRegex(str) {
    try {
        return str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
    }
    catch (e) {
        console.log(String(e.stack));
        return str;
    }
}
exports.default = new builders_1.Event("messageCreate", async (message) => {
    if (!message.guild || !message.channel || message.author.bot || !main_1.client.user)
        return;
    await (0, functions_1.countMessage)(message.author.id, message.guild.id, message);
    await (0, functions_1.createGuild)(message.guild.id, main_1.client);
    await (0, functions_1.createUser)(message.author.id);
    //await Asistent(message, client);
    await (0, helpers_1.Ranking)(message, main_1.client);
    await (0, functions_1.Economy)(message);
    const guildData = await main_1.main.prisma.myGuild.findFirst({ where: { guildId: message.guild.id } });
    const dataPrefix = guildData?.prefix ? guildData.prefix : config_1.config.modules.discord.prefix;
    const prefixRegex = new RegExp(`^(<@!?${main_1.client.user.id}>|${escapeRegex(dataPrefix)})\\s*`);
    //if its not that then return
    if (!prefixRegex.test(message.content))
        return;
    //now define the right prefix either ping or not ping
    const match = message.content.match(prefixRegex);
    if (!match)
        return;
    const [, matchedPrefix] = match;
    const language = message.guild.preferredLocale;
    if (!message.content.startsWith(matchedPrefix))
        return;
    const data = await main_1.main.prisma.userDiscord.findFirst({
        where: {
            userId: message.author.id,
        },
    });
    const clientData = await main_1.main.DB.findDiscord(main_1.client.user.id);
    if (!clientData)
        return message.channel.send({
            embeds: [
                new embeds_extend_1.ErrorEmbed()
                    .setTitle("Error Client Data")
                    .setDescription([
                    `${main_1.client.getEmoji(message.guild.id, "error")} The bot is not set up in this server.`,
                    `Use the command \`${matchedPrefix}setup\` to set up the bot.`,
                ].join("\n")),
            ],
        });
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase() ?? "";
    if (!cmd || !data)
        return;
    const command = main_1.client.precommands.get(cmd) ||
        main_1.client.precommands.find((c) => c?.aliases?.includes(cmd));
    if (!command) {
        const data = await main_1.main.prisma.command.findFirst({
            where: {
                name: cmd,
                guildId: message.guild.id,
            },
        });
        if (!data || !data.isEnabled)
            return;
        if (data.embed) {
            const embed = new embeds_extend_1.EmbedCorrect()
                .setTitle(data.embedTitle || data.name)
                .setDescription(data.response || "Sin respuesta configurada.")
                .setColor(data.embedColor || "Red");
            if (data.embedFooter) {
                embed.setFooter({
                    text: data.embedFooter,
                    iconURL: main_1.client.user?.displayAvatarURL(),
                });
            }
            else {
                embed.setFooter({
                    text: `${data.isEnabled ? "Enabled" : "Disabled"} | ${data.name}`,
                    iconURL: main_1.client.user?.displayAvatarURL(),
                });
            }
            if (data.embedImage)
                embed.setImage(data.embedImage);
            if (data.embedThumbnail)
                embed.setThumbnail(data.embedThumbnail);
            if (data.embedAuthor) {
                embed.setAuthor({
                    name: data.embedAuthor,
                    iconURL: main_1.client.user?.displayAvatarURL(),
                });
            }
            // Botones (si existen)
            let components = [];
            if (data.buttons && Array.isArray(data.buttons) && data.buttons.length > 0) {
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
                const row = new ActionRowBuilder();
                // Ensure each button is an object with the expected properties
                const buttons = data.buttons;
                buttons.forEach((button) => {
                    if (button &&
                        typeof button === "object" &&
                        button.label &&
                        button.style &&
                        ((button.style === "LINK" && button.url) || (button.style !== "LINK" && button.customId))) {
                        const btn = new ButtonBuilder()
                            .setLabel(button.label)
                            .setStyle(ButtonStyle[button.style]);
                        if (button.style === "LINK") {
                            btn.setURL(button.url);
                        }
                        else {
                            btn.setCustomId(button.customId);
                        }
                        row.addComponents(btn);
                    }
                });
                components.push(row);
            }
            if (data.fields && Array.isArray(data.fields) && data.fields.length > 0) {
                data.fields.forEach((field) => {
                    if (!field)
                        return;
                    if (field.name && field.value) {
                        embed.addFields({
                            name: field.name,
                            value: field.value,
                            inline: field.inline || false,
                        });
                    }
                });
            }
            return message.channel.send({
                embeds: [embed],
                components,
                allowedMentions: { repliedUser: false },
                files: data.file ? [data.file] : [],
            });
        }
        // Si no es embed, pero puede tener archivo adjunto
        return message.channel.send({
            content: data.response,
            allowedMentions: { repliedUser: false },
            files: data.file ? [data.file] : [],
        });
    }
    try {
        if (command.owner && !clientData.owners.includes(message.author.id)) {
            return message.channel.send({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setDescription([
                        `${main_1.client.getEmoji(message.guild.id, "error")} You do not have permission to use this command as it is reserved for the bot owner.`,
                        `If you believe this is a mistake, please contact the bot owner.`,
                    ].join("\n")),
                ],
            });
        }
        if (command.maintenance) {
            if (!clientData.owners.includes(message.author.id)) {
                return message.channel.send({
                    embeds: [
                        new embeds_extend_1.ErrorEmbed().setDescription([
                            `${main_1.client.getEmoji(message.guild.id, "error")} This command is currently under maintenance.`,
                            `Command Name: \`${command.name}\``,
                            `Description: ${command.description || "No description available."}`,
                        ].join("\n")),
                    ],
                });
            }
        }
        if (command.nsfw && !message.channel.nsfw) {
            return message.channel.send({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setDescription([
                        `${main_1.client.getEmoji(message.guild.id, "error")} You can only use this command in a NSFW channel.`,
                        `If you believe this is a mistake, please contact the server staff.`,
                    ].join("\n")),
                ],
            });
        }
        if (command.permissions && !message.member?.permissions.has(command.permissions)) {
            return message.channel.send({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setDescription([
                        `${main_1.client.getEmoji(message.guild.id, "error")} You do not have permission to use this command.`,
                        `If you believe this is a mistake, please contact the server staff.`,
                    ].join("\n")),
                ],
            });
        }
        if (command.botpermissions && !message.guild.members.me?.permissions.has(command.botpermissions)) {
            return message.channel.send({
                embeds: [
                    new embeds_extend_1.ErrorEmbed().setDescription([
                        `${main_1.client.getEmoji(message.guild.id, "error")} I do not have permission to execute this command.`,
                        `If you believe this is a mistake, please contact the server staff.`,
                    ].join("\n")),
                ],
            });
        }
        /*    if (command.cooldown) {
          const cooldown =
            (client.cooldown.get(command.name) as Map<string, number>) || new Map<string, number>();
          const now = Date.now();
          const cooldownAmount = command.cooldown * 1000;
    
          if (cooldown.has(message.author.id)) {
            const expirationTime = cooldown.get(message.author.id)! + cooldownAmount;
            if (now < expirationTime) {
              const timeLeft = Math.round((expirationTime - now) / 1000);
              return message.channel.send({
                embeds: [
                  new ErrorEmbed().setDescription(
                    [
                      `${client.getEmoji(message.guild.id, "error")} You are on cooldown for this command.`,
                      `Please wait ${timeLeft} seconds before using it again.`,
                    ].join("\n"),
                  ),
                ],
              });
            }
          }
    
          cooldown.set(message.author.id, now);
          client.cooldown.set(command.name, cooldown);
        } */
        await command.execute(main_1.client, message, args, matchedPrefix, language, config_1.config);
        try {
            const guildId = message.guild.id;
            const commandName = command.name;
            const guildData = await main_1.main.prisma.myGuild.findFirst({ where: { guildId } });
            if (guildData) {
                const usage = guildData.commandUsage || {};
                usage[commandName] = (usage[commandName] || 0) + 1;
                await main_1.main.prisma.myGuild.update({
                    where: { id: guildData.id },
                    data: { commandUsage: usage },
                });
            }
        }
        catch (err) {
            console.debug("[DEBUG] Error updating command usage:", err);
        }
    }
    catch (error) {
        const errorEmbed = new embeds_extend_1.ErrorEmbed().setError(true).setTitle("Command Execution Error").setErrorFormat(error);
        await message.channel.send({ embeds: [errorEmbed] });
    }
    return;
});
//# sourceMappingURL=messageCreate.js.map
//# debugId=379058af-85e6-569f-8ebe-be132fcb52c7
