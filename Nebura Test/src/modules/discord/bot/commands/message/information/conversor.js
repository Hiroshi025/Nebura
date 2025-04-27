"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/* eslint-disable @typescript-eslint/no-explicit-any */
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
/* eslint-disable @typescript-eslint/no-unused-vars */
const coins_json_1 = __importDefault(require("../../../../../../../config/json/coins.json"));
const embeds_extender_1 = require("../../../../../../structure/extenders/discord/embeds.extender");
const precommandConversor = {
    name: "conversor",
    description: "Converts a currency to another currency",
    examples: ["conversor 100"],
    nsfw: false,
    owner: false,
    cooldown: 5,
    aliases: ["converter", "currency"],
    botpermissions: ["SendMessages"],
    permissions: ["SendMessages"],
    async execute(client, message, args, prefix) {
        if (!message.guild ||
            !message.channel ||
            message.channel.type !== discord_js_1.ChannelType.GuildText ||
            !client.user)
            return;
        const structure = "__How to use the command:__ `" +
            prefix +
            "converter [number]`\n" +
            "```js\n" +
            "[] -> Required\n" +
            "() -> Optional\n" +
            "{} -> Clarification\n" +
            "```";
        const moneda = args.join(" ");
        if (!moneda || isNaN(Number(moneda)))
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setTitle("Error - Missing Arguments")
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "error")} Please provide a currency to convert.`,
                        `**Usage:** \`${prefix}conversor <currency>\`\n`,
                        structure,
                    ].join("\n")),
                ],
            });
        const panel1 = new embeds_extender_1.EmbedCorrect()
            .setTitle(`💶 **Currency converter** 💵`)
            .setDescription(`What is the currency of your money?`)
            .setColor(`#F7F9F7`)
            .setTimestamp();
        const menu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("menu-conversor1")
            .setPlaceholder(`💷 Choose an option:`);
        const monedas = coins_json_1.default;
        for (const i in monedas)
            menu.addOptions(new discord_js_1.StringSelectMenuOptionBuilder()
                .setValue(`${i}`)
                .setLabel(`${monedas[i][1]} (${i})`)
                .setDescription(`${monedas[i][0]}`)
                .setEmoji(`${monedas[i][2]}`));
        const menu1 = new discord_js_1.ActionRowBuilder().addComponents(menu);
        const msg1 = await message.channel.send({ embeds: [panel1], components: [menu1] });
        const respuesta1 = await new Promise((resolve) => {
            const filter1 = (menu1) => menu1.user.id === message.author.id;
            const collector1 = msg1.createMessageComponentCollector({ filter: filter1, time: 600000 });
            collector1.on("collect", async (menu1) => {
                const eleccion = menu1.values[0];
                resolve(eleccion);
                menu1.deferUpdate();
                collector1.stop();
            });
            collector1.on("end", () => resolve(null));
        });
        //RESPUESTA 2
        const panel2 = new embeds_extender_1.EmbedCorrect()
            .setDescription(`What currency do you want to convert your money to?`)
            .setColor(`#F7F9F7`)
            .setTimestamp();
        const menu_2 = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("menu-conversor2")
            .setPlaceholder(`💴 Choose an option:`);
        for (const i in monedas)
            menu_2.addOptions(new discord_js_1.StringSelectMenuOptionBuilder()
                .setValue(`${i}`)
                .setLabel(`${monedas[i][1]} (${i})`)
                .setDescription(`${monedas[i][0]}`)
                .setEmoji(`${monedas[i][2]}`));
        const menu2 = new discord_js_1.ActionRowBuilder().addComponents(menu_2);
        const msg2 = await message.channel.send({ embeds: [panel2], components: [menu2] });
        const respuesta2 = await new Promise((resolve, _reject) => {
            const filter2 = (menu2) => menu2.user.id === message.author.id;
            const collector2 = msg2.createMessageComponentCollector({ filter: filter2, time: 600000 });
            collector2.on("collect", async (menu2) => {
                if (!message.guild)
                    return;
                const eleccion = menu2.values[0];
                if (eleccion === respuesta1)
                    return message.channel.send({
                        embeds: [
                            new embeds_extender_1.ErrorEmbed()
                                .setDescription([
                                `${client.getEmoji(message.guild.id, "error")} You cannot convert the same currency to itself...`,
                                `Please choose another currency.`,
                            ].join("\n"))
                                .setColor(`#F7F9F7`),
                        ],
                    });
                else {
                    resolve(eleccion);
                    collector2.stop();
                }
                menu2.deferUpdate();
                return;
            });
            collector2.on("end", () => resolve(null));
        });
        const json = await (0, axios_1.default)({
            method: "GET",
            url: `http://www.floatrates.com/daily/${respuesta1}.json`,
        });
        if (json.status !== 200)
            return;
        // Convertimos el json a un objeto
        const data = JSON.parse(JSON.stringify(json.data));
        const currencyData = data[respuesta2.toLowerCase()];
        if (!currencyData || currencyData.rate === false) {
            return message.channel.send({
                embeds: [
                    new embeds_extender_1.ErrorEmbed()
                        .setDescription([
                        `${client.getEmoji(message.guild.id, "error")} The currency you are trying to convert to does not exist...`,
                        `Please choose another currency.`,
                    ].join("\n"))
                        .setColor(`#F7F9F7`),
                ],
            });
        }
        await message.channel.send({
            embeds: [
                new embeds_extender_1.EmbedCorrect()
                    .setTitle(`${monedas[respuesta1][2]} ⇌ ${monedas[respuesta2][2]}`)
                    .setDescription("`💱`" +
                    ` **${moneda} ${monedas[respuesta1][1]}** are: **${(moneda * data[respuesta2.toLowerCase()].rate).toFixed(2)} ${monedas[respuesta2][1]}**`),
            ],
        });
        return;
    },
};
module.exports = precommandConversor;
