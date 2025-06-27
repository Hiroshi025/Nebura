"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="0a5c7f06-77a4-5c4b-b454-20b97c385a07")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const embeds_extend_1 = require("../../../../../../../../shared/adapters/extends/embeds.extend");
const emojis_json_1 = __importDefault(require("../../../../../../../../../config/json/emojis.json"));
const pagination_1 = require("@discordx/pagination");
const mcblockCommand = {
    name: "mcblock",
    description: "Get details about Minecraft blocks and items",
    examples: ["mcblock [name]", "mcblock list"],
    nsfw: false,
    owner: false,
    cooldown: 5,
    aliases: ["minecraftblock", "mcitem"],
    botpermissions: ["SendMessages", "EmbedLinks", "ManageMessages"],
    permissions: ["SendMessages"],
    async execute(_client, message, args, prefix) {
        try {
            if (!message.guild)
                return;
            // Fetch blocks from Mojang API
            const response = await axios_1.default.get("https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.20/blocks.json");
            const blocks = response.data;
            const blockName = args.join(" ");
            if (!blockName) {
                return await showBlockMenu(message, blocks);
            }
            if (blockName.toLowerCase() === "list") {
                return await showBlockList(message, blocks);
            }
            const block = findBlock(blockName, blocks);
            if (!block) {
                return message.reply({
                    embeds: [
                        new discord_js_1.EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${emojis_json_1.default.error} Block/Item not found. Use \`${prefix}mcblock list\` to see available blocks.`),
                    ],
                });
            }
            return await showBlockDetails(message, block, blocks);
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
async function showBlockMenu(message, blocks) {
    const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("block-select")
        .setPlaceholder("Select a block/item")
        .addOptions(blocks.slice(0, 25).map((block) => ({
        label: block.displayName,
        value: block.id.toString(),
        description: `ID: ${block.id}`,
    }))));
    const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("block-search").setLabel("Search Block").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("block-list").setLabel("View All").setStyle(discord_js_1.ButtonStyle.Secondary));
    const menuMessage = await message.reply({
        embeds: [
            new discord_js_1.EmbedBuilder()
                .setColor("#2ECC71")
                .setTitle("Minecraft Blocks & Items")
                .setDescription("Select a block/item from the menu below or search for one")
                .setThumbnail("https://www.minecraft.net/content/dam/minecraft/touchup-2020/minecraft-logo.svg"),
        ],
        components: [selectMenu, buttons],
    });
    // Create interaction collector
    const collector = menuMessage.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.StringSelect,
        time: 60000,
    });
    collector.on("collect", async (interaction) => {
        if (interaction.customId === "block-select") {
            const blockId = interaction.values[0];
            const block = blocks.find((b) => b.id.toString() === blockId);
            if (block) {
                await interaction.deferUpdate();
                await showBlockDetails(menuMessage, block, blocks);
            }
        }
    });
    collector.on("end", () => {
        menuMessage.edit({ components: [] }).catch(() => { });
    });
}
async function showBlockList(message, blocks) {
    const pages = [];
    const itemsPerPage = 6;
    for (let i = 0; i < blocks.length; i += itemsPerPage) {
        const current = blocks.slice(i, i + itemsPerPage);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("#2ECC71")
            .setTitle("Minecraft Blocks & Items List")
            .setDescription("Here are available Minecraft blocks and items:")
            .setThumbnail("https://www.minecraft.net/content/dam/minecraft/touchup-2020/minecraft-logo.svg")
            .setFooter({
            text: `Page ${Math.floor(i / itemsPerPage) + 1} of ${Math.ceil(blocks.length / itemsPerPage)}`,
        });
        current.forEach((block) => {
            embed.addFields({
                name: block.displayName,
                value: `**ID:** ${block.id}\n**Stack Size:** ${block.stackSize || 64}`,
                inline: true,
            });
        });
        pages.push({ embeds: [embed] });
    }
    const pagination = new pagination_1.Pagination(message, pages);
    await pagination.send();
}
function findBlock(name, blocks) {
    const lowerName = name.toLowerCase();
    return blocks.find((block) => block.displayName.toLowerCase().includes(lowerName) ||
        block.name.toLowerCase().includes(lowerName) ||
        block.id.toString() === name);
}
async function showBlockDetails(message, block, blocks) {
    // Get block image from Minecraft API
    const imageUrl = `https://minecraft-api.com/api/blocks/${encodeURIComponent(block.name)}.png`;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle(`Block/Item: ${block.displayName}`)
        .setDescription(`**Name ID:** ${block.name}`)
        .addFields({ name: "ID", value: block.id.toString(), inline: true }, { name: "Stack Size", value: (block.stackSize || 64).toString(), inline: true }, { name: "Hardness", value: block.hardness?.toString() || "N/A", inline: true }, { name: "Resistance", value: block.resistance?.toString() || "N/A", inline: true }, { name: "Luminance", value: block.luminance?.toString() || "0", inline: true }, { name: "Transparent", value: block.transparent ? "Yes" : "No", inline: true })
        .setImage(imageUrl);
    // Add crafting recipe button if available
    const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setLabel("View Recipe")
        .setURL(`https://minecraft.wiki/w/${encodeURIComponent(block.name)}`)
        .setStyle(discord_js_1.ButtonStyle.Link), new discord_js_1.ButtonBuilder().setCustomId("block-back").setLabel("Back to List").setStyle(discord_js_1.ButtonStyle.Secondary));
    const detailMessage = await message.reply({
        embeds: [embed],
        components: [buttons],
    });
    // Create button collector
    const collector = detailMessage.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 60000,
    });
    collector.on("collect", async (interaction) => {
        if (interaction.customId === "block-back") {
            await interaction.deferUpdate();
            await showBlockMenu(detailMessage, blocks);
        }
    });
    collector.on("end", () => {
        detailMessage.edit({ components: [] }).catch(() => { });
    });
}
module.exports = mcblockCommand;
//# sourceMappingURL=mcblock.js.map
//# debugId=0a5c7f06-77a4-5c4b-b454-20b97c385a07
