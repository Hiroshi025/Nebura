"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="36582f03-ad70-5d4d-93a6-fe5425396835")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const emojis_json_1 = __importDefault(require("../../../../../../../../../config/json/emojis.json"));
const pagination_1 = require("@discordx/pagination");
const mcbiomeCommand = {
    name: "mcbiome",
    description: "Show information about a Minecraft biome",
    examples: ["mcbiome [name]", "mcbiome list"],
    nsfw: false,
    owner: false,
    cooldown: 5,
    aliases: ["minecraftbiome"],
    botpermissions: ["SendMessages", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(_client, message, args, prefix) {
        try {
            if (!message.guild)
                return;
            // Fetch biomes from Mojang API
            const response = await axios_1.default.get("https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.20/biomes.json");
            const biomes = response.data;
            const biomeName = args.join(" ");
            if (!biomeName) {
                return await showBiomeMenu(message, biomes);
            }
            if (biomeName.toLowerCase() === "list") {
                return await showBiomeList(message, biomes);
            }
            const biome = findBiome(biomeName, biomes);
            if (!biome) {
                return message.reply({
                    embeds: [
                        new discord_js_1.EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${emojis_json_1.default.error} Biome not found. Use \`${prefix}mcbiome list\` to see available biomes.`),
                    ],
                });
            }
            return await showBiomeDetails(message, biome);
        }
        catch (e) {
            return message.reply({
                embeds: [
                    new embeds_extend_1.ErrorEmbed()
                        .setFooter({
                        text: `Requested by: ${message.author.tag}`,
                        iconURL: message.author.displayAvatarURL(),
                    })
                        .setDescription([
                        `${emojis_json_1.default.error} An error occurred while executing this command!`,
                        `Please try again later or join our support server for help!`,
                    ].join("\n"))
                        .setErrorFormat(e.stack),
                ],
            });
        }
    },
};
async function showBiomeMenu(message, biomes) {
    const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("biome-select")
        .setPlaceholder("Select a biome")
        .addOptions(biomes.map((biome) => ({
        label: biome.name,
        value: biome.id.toString(),
        description: biome.category,
    }))));
    await message.reply({
        embeds: [
            new discord_js_1.EmbedBuilder()
                .setColor("#2ECC71")
                .setTitle("Minecraft Biomes")
                .setDescription("Select a biome from the menu below")
                .setThumbnail("https://www.minecraft.net/content/dam/minecraft/touchup-2020/minecraft-logo.svg"),
        ],
        components: [selectMenu],
    });
}
async function showBiomeList(message, biomes) {
    const pages = [];
    const itemsPerPage = 5;
    for (let i = 0; i < biomes.length; i += itemsPerPage) {
        const current = biomes.slice(i, i + itemsPerPage);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("#2ECC71")
            .setTitle("Minecraft Biomes List")
            .setDescription("Here are all available Minecraft biomes:")
            .setThumbnail("https://www.minecraft.net/content/dam/minecraft/touchup-2020/minecraft-logo.svg")
            .setFooter({
            text: `Page ${Math.floor(i / itemsPerPage) + 1} of ${Math.ceil(biomes.length / itemsPerPage)}`,
        });
        current.forEach((biome) => {
            embed.addFields({
                name: biome.name,
                value: `**Category:** ${biome.category}\n**ID:** ${biome.id}`,
                inline: true,
            });
        });
        pages.push({ embeds: [embed] });
    }
    const pagination = new pagination_1.Pagination(message, pages);
    await pagination.send();
}
function findBiome(name, biomes) {
    const lowerName = name.toLowerCase();
    return biomes.find((biome) => biome.name.toLowerCase().includes(lowerName) || biome.id === name);
}
async function showBiomeDetails(message, biome) {
    // Get biome image from Minecraft API
    const imageUrl = `https://minecraft-api.com/api/biomes/${encodeURIComponent(biome.name)}.png`;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle(`Biome: ${biome.name}`)
        .setDescription(`**Category:** ${biome.category}`)
        .addFields({
        name: "Biome Details",
        value: `**ID:** ${biome.id}\n**Temperature:** ${biome.temperature}\n**Has Precipitation:** ${biome.has_precipitation}\n**Dimension:** ${biome.dimension}`,
        inline: false,
    }, {
        name: "Display Information",
        value: `**Display Name:** ${biome.displayName}\n**Color Code:** ${biome.color}`,
        inline: false,
    })
        .setImage(imageUrl);
    await message.reply({ embeds: [embed] });
}
module.exports = mcbiomeCommand;
//# sourceMappingURL=mcbiome.js.map
//# debugId=36582f03-ad70-5d4d-93a6-fe5425396835
