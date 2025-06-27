import axios from "axios";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

import emojis from "@config/json/emojis.json";
import { Pagination } from "@discordx/pagination";
import { Precommand } from "@typings/modules/discord";
import { ErrorEmbed } from "@utils/extenders/embeds.extend";

const mcblockCommand: Precommand = {
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
      if (!message.guild) return;

      // Fetch blocks from Mojang API
      const response = await axios.get(
        "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.20/blocks.json",
      );
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
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                `${emojis.error} Block/Item not found. Use \`${prefix}mcblock list\` to see available blocks.`,
              ),
          ],
        });
      }

      return await showBlockDetails(message, block, blocks);
    } catch (e: any) {
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setFooter({
              text: `Requested by: ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(
              [
                `${emojis.error} An error occurred while executing this command!`,
                `Please try again later or join our support server for help!`,
              ].join("\n"),
            )
            .setErrorFormat(e.stack),
        ],
      });
    }
  },
};

async function showBlockMenu(message: any, blocks: any[]) {
  const selectMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("block-select")
      .setPlaceholder("Select a block/item")
      .addOptions(
        blocks.slice(0, 25).map((block) => ({
          label: block.displayName,
          value: block.id.toString(),
          description: `ID: ${block.id}`,
        })),
      ),
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("block-search").setLabel("Search Block").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("block-list").setLabel("View All").setStyle(ButtonStyle.Secondary),
  );

  const menuMessage = await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("Minecraft Blocks & Items")
        .setDescription("Select a block/item from the menu below or search for one")
        .setThumbnail("https://www.minecraft.net/content/dam/minecraft/touchup-2020/minecraft-logo.svg"),
    ],
    components: [selectMenu, buttons],
  });

  // Create interaction collector
  const collector = menuMessage.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
  });

  collector.on("collect", async (interaction: { customId: string; values: any[]; deferUpdate: () => any }) => {
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
    menuMessage.edit({ components: [] }).catch(() => {});
  });
}

async function showBlockList(message: any, blocks: any[]) {
  const pages = [];
  const itemsPerPage = 6;

  for (let i = 0; i < blocks.length; i += itemsPerPage) {
    const current = blocks.slice(i, i + itemsPerPage);

    const embed = new EmbedBuilder()
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

  const pagination = new Pagination(message, pages);
  await pagination.send();
}

function findBlock(name: string, blocks: any[]) {
  const lowerName = name.toLowerCase();
  return blocks.find(
    (block) =>
      block.displayName.toLowerCase().includes(lowerName) ||
      block.name.toLowerCase().includes(lowerName) ||
      block.id.toString() === name,
  );
}

async function showBlockDetails(message: any, block: any, blocks: any[]) {
  // Get block image from Minecraft API
  const imageUrl = `https://minecraft-api.com/api/blocks/${encodeURIComponent(block.name)}.png`;

  const embed = new EmbedBuilder()
    .setColor("#2ECC71")
    .setTitle(`Block/Item: ${block.displayName}`)
    .setDescription(`**Name ID:** ${block.name}`)
    .addFields(
      { name: "ID", value: block.id.toString(), inline: true },
      { name: "Stack Size", value: (block.stackSize || 64).toString(), inline: true },
      { name: "Hardness", value: block.hardness?.toString() || "N/A", inline: true },
      { name: "Resistance", value: block.resistance?.toString() || "N/A", inline: true },
      { name: "Luminance", value: block.luminance?.toString() || "0", inline: true },
      { name: "Transparent", value: block.transparent ? "Yes" : "No", inline: true },
    )
    .setImage(imageUrl);

  // Add crafting recipe button if available
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("View Recipe")
      .setURL(`https://minecraft.wiki/w/${encodeURIComponent(block.name)}`)
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder().setCustomId("block-back").setLabel("Back to List").setStyle(ButtonStyle.Secondary),
  );

  const detailMessage = await message.reply({
    embeds: [embed],
    components: [buttons],
  });

  // Create button collector
  const collector = detailMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  collector.on("collect", async (interaction: { customId: string; deferUpdate: () => any }) => {
    if (interaction.customId === "block-back") {
      await interaction.deferUpdate();
      await showBlockMenu(detailMessage, blocks);
    }
  });

  collector.on("end", () => {
    detailMessage.edit({ components: [] }).catch(() => {});
  });
}

// (Removed unused handleBlockInteractions function)

export = mcblockCommand;
