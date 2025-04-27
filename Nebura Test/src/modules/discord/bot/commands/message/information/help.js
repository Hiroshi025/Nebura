"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const common_tags_1 = require("common-tags");
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
/* eslint-disable @typescript-eslint/no-explicit-any */
const emojis_json_1 = __importDefault(require("../../../../../../../config/json/emojis.json"));
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const config_1 = require("../../../../../../shared/utils/config");
const package_json_1 = __importDefault(require("../../../../../../../package.json"));
function getCommandsFromFolder(path) {
    let commands = [];
    const files = (0, fs_1.readdirSync)(path);
    for (const file of files) {
        const fullPath = (0, path_1.join)(path, file);
        if ((0, fs_1.statSync)(fullPath).isDirectory()) {
            // If it's a folder, call the function recursively
            commands = commands.concat(getCommandsFromFolder(fullPath));
        }
        else if (file.endsWith(".ts") || file.endsWith(".js")) {
            // If it's a .ts or .js file, add it to the commands list
            const name = file.replace(/\.(ts|js)/, "");
            commands.push(name);
        }
    }
    return commands;
}
const helpCommand = {
    name: "help",
    description: "View the help menu of the bot",
    examples: ["help", "help <command>", "help <category>"],
    nsfw: false,
    owner: false,
    aliases: ["h", "commands"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(client, message, args, prefix) {
        const categorias = (0, fs_1.readdirSync)(config_1.config.modules.discord.configs.precommands);
        if (!message.guild)
            return;
        if (!client.user)
            return;
        if (args[0]) {
            const comando = client.precommands.get(args[0].toLowerCase()) ||
                client.precommands.find((c) => c.aliases && c.aliases.includes(args[0].toLowerCase()));
            const categoria = categorias.find((categoria) => categoria.toLowerCase().endsWith(args[0].toLowerCase()));
            if (comando) {
                const embed = new embeds_extender_1.EmbedCorrect()
                    .setAuthor({
                    name: `Command Information: ${comando.name}`,
                    iconURL: client.user.displayAvatarURL(),
                })
                    .setFooter({
                    text: `Version: ${package_json_1.default.version} | Author: ${package_json_1.default.author}`,
                    iconURL: message.guild?.iconURL({ forceStatic: true }),
                })
                    .setThumbnail(message.guild?.iconURL({ forceStatic: true }))
                    .setColor("Green");
                if (comando.description)
                    embed.setDescription(`> ${comando.description}`);
                if (comando.category)
                    embed.addFields([
                        {
                            name: `Category`,
                            value: `> \`${comando.category}\``,
                            inline: true,
                        },
                    ]);
                if (comando.cooldown)
                    embed.addFields([
                        {
                            name: `Cooldown`,
                            value: `> \`${comando.cooldown ? comando.cooldown : 3}s\``,
                            inline: true,
                        },
                    ]);
                if (comando.subcommands)
                    embed.addFields([
                        {
                            name: `List in subcommands`,
                            value: `${comando.subcommands.map((subcommand) => `• \`${subcommand}\``).join("\n")}`,
                        },
                    ]);
                if (comando.usage)
                    embed.addFields([
                        {
                            name: `Usage`,
                            value: `\`${prefix}${comando.usage}\``,
                        },
                    ]);
                if (comando.examples)
                    embed.addFields([
                        {
                            name: `Examples`,
                            value: `${comando.examples.map((ejemplo) => `\`${prefix}${ejemplo}\``).join("\n")}`,
                        },
                    ]);
                if (comando.aliases && comando.aliases.length >= 1)
                    embed.addFields([
                        {
                            name: `Aliases`,
                            value: `${comando.aliases.map((alias) => `${alias}`).join(", ")}`,
                        },
                    ]);
                if (comando.permissions && comando.permissions.length >= 1)
                    embed.addFields([
                        {
                            name: `Permissions`,
                            value: `${comando.permissions
                                .map((permission) => {
                                return `No.${comando.permissions.indexOf(permission) + 1} - \`${permission}\``;
                            })
                                .join("\n")}`,
                            inline: true,
                        },
                    ]);
                if (comando.botpermissions && comando.botpermissions.length >= 1)
                    embed.addFields([
                        {
                            name: `Bot Permissions`,
                            value: `${comando.botpermissions
                                .map((permission) => {
                                return `No.${comando.botpermissions.indexOf(permission) + 1} - \`${permission}\``;
                            })
                                .join("\n")}`,
                            inline: true,
                        },
                    ]);
                return message.reply({ embeds: [embed] }).catch((e) => {
                    return message.reply({
                        embeds: [
                            new embeds_extender_1.ErrorEmbed()
                                .setTitle("Help Menu - Error")
                                .setDescription([
                                `${emojis_json_1.default.error} An error occurred while sending the help menu to your DMs!`,
                                `**Solution:** Make sure you have DMs enabled and try again!`,
                            ].join("\n"))
                                .setErrorFormat(e.message, e.stack),
                        ],
                    });
                });
            }
            else if (categoria) {
                const comandos_de_categoria = getCommandsFromFolder(`${config_1.config.modules.discord.configs.precommands}${categoria}`);
                return message.reply({
                    embeds: [
                        new discord_js_1.EmbedBuilder()
                            .setTitle(`${categoria}`)
                            .setColor("Random")
                            .setDescription(comandos_de_categoria.length >= 1
                            ? `>>> *${comandos_de_categoria.map((comando) => `\`${comando.replace(/\.(ts|js)/, "")}\``).join(" - ")}*`
                            : `>>> *There are no commands in this category yet!...*`),
                    ],
                });
            }
            else {
                return message.reply({
                    embeds: [
                        new embeds_extender_1.ErrorEmbed()
                            .setTitle("Help Menu - Error")
                            .setDescription([
                            `${emojis_json_1.default.error} **The specified command could not be found!**`,
                            `Use \`${prefix}help\` to view the commands and categories!`,
                        ].join("\n")),
                    ],
                });
            }
        }
        else {
            let paginaActual = 0;
            const ayuda_embed = new discord_js_1.EmbedBuilder()
                .setAuthor({
                name: `Pixel Hub Client`,
                iconURL: client.user.displayAvatarURL(),
            })
                .setFooter({
                text: `Version: ${package_json_1.default.version} | Author: ${package_json_1.default.author}`,
                iconURL: client.user.displayAvatarURL(),
            })
                .setFields({
                name: "👋 Welcome to the Discord Client",
                value: [
                    `Welcome to the help menu of our control client **${client.user.username}**!`,
                ].join("\n"),
                inline: false,
            }, {
                name: "__**Client Information**__",
                value: (0, common_tags_1.stripIndent) `
              **Developer:** ${config_1.config.modules.discord.owners.map((owner) => (0, discord_js_1.userMention)(owner)).join(" - ")}
              **Ping to the API:** \`${client.ws.ping}ms\` 
              **Platform:** \`${process.platform}\`
              **Memory Usage:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`
              **Node.js Version:** \`${process.version}\`
            `,
                inline: true,
            })
                .setThumbnail(message.guild?.iconURL({ forceStatic: true }))
                .setColor("Random")
                .setTimestamp();
            const embeds_pages = [ayuda_embed];
            categorias.map(async (categoria, index) => {
                const comandos_de_categoria = getCommandsFromFolder(`${config_1.config.modules.discord.configs.precommands}${categoria}`);
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle(`${categoria}`)
                    .setColor("Random")
                    .setThumbnail(message.guild?.iconURL({ forceStatic: true }))
                    .setDescription(comandos_de_categoria.length >= 1
                    ? `>>> *${comandos_de_categoria.map((comando) => `\`${comando.replace(/\.(ts|js)/, "")}\``).join(" - ")}*`
                    : `>>> ${emojis_json_1.default.error} *There are no commands in this category yet...*`)
                    .setFooter({
                    text: `Páge ${index + 2} / ${categorias.length + 1}\n Version: ${package_json_1.default.version} | Author: ${package_json_1.default.author}`,
                    iconURL: message.guild?.iconURL({ forceStatic: true }),
                });
                embeds_pages.push(embed);
            });
            const seleccion = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
                .setCustomId(`SelecciónMenuAyuda`)
                .setPlaceholder("Prefix (text) commands")
                .setMinValues(1)
                .addOptions(categorias.map((categoria) => {
                const objeto = {
                    label: categoria,
                    value: categoria,
                    description: `There are ${(0, fs_1.readdirSync)(`${config_1.config.modules.discord.configs.precommands}${categoria}`).length} commands in this category`,
                };
                return objeto;
            })));
            const botones = new discord_js_1.ActionRowBuilder().addComponents([
                new discord_js_1.ButtonBuilder()
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji(emojis_json_1.default.help.back)
                    .setLabel("Back")
                    .setCustomId("Back"),
                new discord_js_1.ButtonBuilder()
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setLabel("Home")
                    .setEmoji(emojis_json_1.default.help.home)
                    .setCustomId("Home"),
                new discord_js_1.ButtonBuilder()
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setLabel("Forward")
                    .setEmoji(emojis_json_1.default.help.forward)
                    .setCustomId("Forward"),
            ]);
            const mensaje_ayuda = await message
                .reply({
                embeds: [ayuda_embed],
                components: [seleccion, botones],
            })
                .catch((e) => {
                console.log(e);
                return message.reply({
                    content: [
                        `${emojis_json_1.default.error} An error occurred while sending the help menu to your DMs!`,
                        `**Solution:** Make sure you have DMs enabled and try again!`,
                    ].join("\n"),
                });
            });
            const collector = mensaje_ayuda.createMessageComponentCollector({
                filter: (i) => i.isButton() ||
                    (i.isStringSelectMenu() && i.user && i.message.author.id == client.user?.id),
                time: 180e3,
            });
            collector.on("collect", async (interaction) => {
                if (interaction.isButton()) {
                    if (interaction.user.id !== message.author.id) {
                        await interaction.reply({
                            content: `${emojis_json_1.default.error} **You can not do that! Only ${message.author}** you can interact with the help menu`,
                            ephemeral: true,
                        });
                    }
                    switch (interaction.customId) {
                        case "Back":
                            {
                                collector.resetTimer();
                                if (paginaActual !== 0) {
                                    paginaActual -= 1;
                                    await mensaje_ayuda
                                        .edit({ embeds: [embeds_pages[paginaActual]] })
                                        .catch(() => { });
                                    await interaction?.deferUpdate();
                                }
                                else {
                                    paginaActual = embeds_pages.length - 1;
                                    await mensaje_ayuda
                                        .edit({ embeds: [embeds_pages[paginaActual]] })
                                        .catch(() => { });
                                    await interaction?.deferUpdate();
                                }
                            }
                            break;
                        case "Home":
                            {
                                collector.resetTimer();
                                paginaActual = 0;
                                await mensaje_ayuda
                                    .edit({ embeds: [embeds_pages[paginaActual]] })
                                    .catch(() => { });
                                await interaction?.deferUpdate();
                            }
                            break;
                        case "Forward":
                            {
                                collector.resetTimer();
                                if (paginaActual < embeds_pages.length - 1) {
                                    paginaActual++;
                                    await mensaje_ayuda
                                        .edit({ embeds: [embeds_pages[paginaActual]] })
                                        .catch(() => { });
                                    await interaction?.deferUpdate();
                                }
                                else {
                                    paginaActual = 0;
                                    await mensaje_ayuda
                                        .edit({ embeds: [embeds_pages[paginaActual]] })
                                        .catch(() => { });
                                    await interaction?.deferUpdate();
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
                else {
                    const embeds = [];
                    for (const seleccionado of interaction.values) {
                        const comandos_de_categoria = getCommandsFromFolder(`${config_1.config.modules.discord.configs.precommands}${seleccionado}`);
                        const embed = new discord_js_1.EmbedBuilder()
                            .setTitle(`${seleccionado}`)
                            .setColor("Random")
                            .setThumbnail(message.guild?.iconURL({ forceStatic: true }))
                            .setDescription(comandos_de_categoria.length >= 1
                            ? `>>> *${comandos_de_categoria.map((comando) => `\`${comando.replace(/\.(ts|js)/, "")}\``).join(" - ")}*`
                            : `>>> ${emojis_json_1.default.error} *There are no commands in this category yet, come back later*`)
                            .setFooter({
                            text: `Version: ${package_json_1.default.version} | Author: ${package_json_1.default.author}`,
                            iconURL: message.guild?.iconURL({
                                forceStatic: true,
                            }),
                        });
                        embeds.push(embed);
                    }
                    interaction.reply({ embeds, ephemeral: true }).catch(() => {
                        return message.reply({
                            content: [
                                `${emojis_json_1.default.error} An error occurred while sending the help menu to your DMs!`,
                                `**Solution:** Make sure you have DMs enabled and try again!`,
                            ].join("\n"),
                        });
                    });
                }
            });
            collector.on("end", () => {
                mensaje_ayuda
                    .edit({
                    content: `${emojis_json_1.default.error} Oops your time has expired! Type \`help\` again to see it again!`,
                    components: [],
                })
                    .catch((e) => {
                    return message.reply({
                        embeds: [
                            new embeds_extender_1.ErrorEmbed()
                                .setTitle("Help Menu - Error")
                                .setDescription([
                                `${emojis_json_1.default.error} An error occurred while sending the help menu to your DMs!`,
                                `**Solution:** Make sure you have DMs enabled and try again!`,
                            ].join("\n"))
                                .setErrorFormat(e.message, e.stack),
                        ],
                    });
                });
            });
        }
        return;
    },
};
module.exports = helpCommand;
