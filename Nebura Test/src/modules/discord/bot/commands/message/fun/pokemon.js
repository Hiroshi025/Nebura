"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
/* eslint-disable @typescript-eslint/no-explicit-any */
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const console_1 = require("../../../../../../shared/utils/functions/console");
const pokedexCommand = {
    name: "pokedex",
    description: "Pokedex command can show you information about pokemon",
    examples: ["pokedex <pokemon>"],
    nsfw: false,
    owner: false,
    cooldown: 15,
    aliases: ["pokedex-search", "pokedex-pokemon", "pokedex-info", "pokemon"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    subcommands: ["pokedex info <name>"],
    async execute(client, message, args, prefix) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const subcommand = args[0];
        switch (subcommand) {
            case "info":
                {
                    try {
                        const pokemon = args.slice(1).join(" ");
                        if (!message.guild)
                            return;
                        if (!pokemon)
                            return message.reply({
                                content: [
                                    `${client.getEmoji(message.guild.id, "error")} Please provide a pokemon name!`,
                                    `Correct usage: \`${prefix}pokedex <pokemon>\``,
                                ].join("\n"),
                            });
                        const response = await getResponse(`https://pokeapi.glitch.me/v1/pokemon/${pokemon}`);
                        if (response.status === 404) {
                            message.channel.send({
                                content: [
                                    `${client.getEmoji(message.guild.id, "error")} The pokemon \`${pokemon}\` was not found in the PokéDex!`,
                                    `Please make sure you spelled the name correctly and try again!`,
                                ].join("\n"),
                            });
                        }
                        else {
                            if (!response.success)
                                return;
                            const json = response.data[0];
                            if (!json)
                                return;
                            const name = json.name.toLowerCase();
                            let hiddenAbilities = ` and ${json.abilities.hidden}.`;
                            if (!json.abilities.hidden.length) {
                                hiddenAbilities = ".";
                            }
                            let gender = json.gender;
                            if (!json.gender.length) {
                                gender = "Genderless";
                            }
                            const button = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                                .setLabel("Bulbapedia")
                                .setURL(`https://bulbapedia.bulbagarden.net/wiki/${json.name}`)
                                .setStyle(discord_js_1.ButtonStyle.Link), new discord_js_1.ButtonBuilder()
                                .setLabel("Serebii")
                                .setURL(`https://www.serebii.net/pokedex-swsh/${json.name.toLowerCase()}`)
                                .setStyle(discord_js_1.ButtonStyle.Link), new discord_js_1.ButtonBuilder()
                                .setLabel("Smogon")
                                .setURL(`https://www.smogon.com/dex/ss/pokemon/${json.name.toLowerCase()}`)
                                .setStyle(discord_js_1.ButtonStyle.Link));
                            await message.channel.send({
                                embeds: [
                                    new discord_js_1.EmbedBuilder()
                                        .setAuthor({
                                        name: `PokéDex: ${json.name}`,
                                        iconURL: `https://play.pokemonshowdown.com/sprites/ani/${name}.gif`,
                                    })
                                        .setColor("Random")
                                        .setThumbnail(`https://play.pokemonshowdown.com/sprites/ani/${name}.gif`)
                                        .addFields({
                                        name: "National Dex Number",
                                        value: `${json.nationalNumber}`,
                                        inline: true,
                                    }, {
                                        name: "Type(s)",
                                        value: `${json.types.join(", ")}`,
                                        inline: true,
                                    }, {
                                        name: "Abilities",
                                        value: `${json.abilities.normal}${hiddenAbilities}`,
                                        inline: false,
                                    }, { name: "Gender Ratio", value: `${gender}`, inline: false }, {
                                        name: "Height and Weight",
                                        value: `${json.height} foot tall\n${json.weight}`,
                                        inline: true,
                                    }, {
                                        name: "Evolutionary line",
                                        value: `${json.family.evolutionLine.join(", ")}\nCurrent Evolution Stage: ${json.family.evolutionStage}`,
                                        inline: true,
                                    }, { name: "Generation", value: `${json.gen}`, inline: false }, {
                                        name: "Egg Groups",
                                        value: `${json.eggGroups.join(", ")}`,
                                        inline: false,
                                    }, {
                                        name: "Catch Rate",
                                        value: `${json.captureRate}`,
                                        inline: false,
                                    })
                                        .setFooter({ text: json.description }),
                                ],
                                components: [button],
                            });
                        }
                    }
                    catch (err) {
                        (0, console_1.logWithLabel)("error", `The following error occured: ${err}`);
                        if (!message.guild)
                            return;
                        message.channel.send({
                            embeds: [
                                new embeds_extender_1.ErrorEmbed()
                                    .setTitle("An error occurred")
                                    .setDescription([
                                    `${client.getEmoji(message.guild.id, "error")} The following error occured: \`${err}\``,
                                    `**Example:** \`${prefix}pokedex pikachu\``,
                                ].join("\n")),
                            ],
                        });
                    }
                }
                break;
        }
        async function getResponse(url) {
            try {
                const res = await axios_1.default.get(url);
                return {
                    success: true,
                    status: res.status,
                    data: res.data,
                };
            }
            catch (error) {
                return {
                    success: false,
                    status: error.response?.status,
                    data: error.response?.data,
                };
            }
        }
        return;
    },
};
module.exports = pokedexCommand;
