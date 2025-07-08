import axios from "axios";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder,
	StringSelectMenuBuilder
} from "discord.js";

import emojis from "@config/json/emojis.json";
import { Pagination } from "@discordx/pagination";
import { Precommand } from "@typings/modules/discord";
import { ErrorEmbed } from "@utils/extends/embeds.extension";

const mcblockCommand: Precommand = {
  name: "mcblock",
  nameLocalizations: {
    "es-ES": "mc-bloque",
    "en-US": "mcblock",
  },
  description: "Get details about Minecraft blocks and items",
  descriptionLocalizations: {
    "es-ES": "Obtén detalles sobre bloques y objetos de Minecraft",
    "en-US": "Get details about Minecraft blocks and items",
  },
  examples: ["mcblock [name]", "mcblock list"],
  nsfw: false,
  category: "Minecraft",
  owner: false,
  cooldown: 5,
  aliases: ["minecraftblock", "mcitem"],
  botpermissions: ["SendMessages", "EmbedLinks", "ManageMessages"],
  permissions: ["SendMessages"],
  subcommands: [
    "mcblock list: List all Minecraft blocks",
    "mcblock [name]: Get details about a specific Minecraft block or item",
  ],
  async execute(_client, message, args, prefix) {
    try {
      if (!message.guild) return;

      // Multilenguaje
      const userLang = message.guild?.preferredLocale || "es-ES";
      const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
      const t = _client.translations.getFixedT(lang, "discord");

      // Fetch blocks from Mojang API
      const response = await axios.get(
        "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.20/blocks.json",
      );
      const blocks = response.data;

      const blockName = args.join(" ");

      if (!blockName) {
        return await showBlockMenu(message, blocks, t);
      }

      if (blockName.toLowerCase() === "list") {
        return await showBlockList(message, blocks, t);
      }

      const block = findBlock(blockName, blocks);

      if (!block) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(`${emojis.error} ${t("mcblock.notFound")}`.replace("{prefix}", prefix)),
          ],
        });
      }

      return await showBlockDetails(message, block, blocks, t);
    } catch (e: any) {
      const userLang = message.guild?.preferredLocale || "es-ES";
      const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
      const t = _client.translations.getFixedT(lang, "discord");
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setFooter({
              text: `Requested by: ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(
              [
                `${emojis.error} ${t ? t("mcblock.errorExec") : "An error occurred while executing this command!"}`,
                t ? t("mcblock.tryAgain") : "Please try again later or join our support server for help!",
              ].join("\n"),
            )
            .setErrorFormat(e.stack),
        ],
      });
    }
  },
};

async function showBlockMenu(message: any, blocks: any[], t: any) {
  const selectMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("block-select")
      .setPlaceholder(t("mcblock.menuPlaceholder"))
      .addOptions(
        blocks.slice(0, 25).map((block) => ({
          label: block.displayName,
          value: block.id.toString(),
          description: `${t("mcblock.id")}: ${block.id}`,
        })),
      ),
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("block-search").setLabel(t("mcblock.searchButton")).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("block-list").setLabel(t("mcblock.viewAllButton")).setStyle(ButtonStyle.Secondary),
  );

  const menuMessage = await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle(t("mcblock.menuTitle"))
        .setDescription(t("mcblock.menuDesc"))
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
        await showBlockDetails(menuMessage, block, blocks, t);
      }
    }
  });

  collector.on("end", () => {
    menuMessage.edit({ components: [] }).catch(() => {});
  });
}

async function showBlockList(message: any, blocks: any[], t: any) {
  const pages = [];
  const itemsPerPage = 6;

  for (let i = 0; i < blocks.length; i += itemsPerPage) {
    const current = blocks.slice(i, i + itemsPerPage);

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle(t("mcblock.listTitle"))
      .setDescription(t("mcblock.listDesc"))
      .setThumbnail("https://www.minecraft.net/content/dam/minecraft/touchup-2020/minecraft-logo.svg")
      .setFooter({
        text: t("mcblock.pageFooter", {
          page: Math.floor(i / itemsPerPage) + 1,
          total: Math.ceil(blocks.length / itemsPerPage),
        }),
      });

    current.forEach((block) => {
      embed.addFields({
        name: block.displayName,
        value: `**${t("mcblock.id")}:** ${block.id}\n**${t("mcblock.stackSize")}:** ${block.stackSize || 64}`,
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

async function showBlockDetails(message: any, block: any, blocks: any[], t: any) {
  // Get block image from Minecraft API
  const imageUrl = `https://minecraft-api.com/api/blocks/${encodeURIComponent(block.name)}.png`;

  const embed = new EmbedBuilder()
    .setColor("#2ECC71")
    .setTitle(`${t("mcblock.detailTitle")}: ${block.displayName}`)
    .setDescription(`**${t("mcblock.nameId")}:** ${block.name}`)
    .addFields(
      { name: t("mcblock.id"), value: block.id.toString(), inline: true },
      { name: t("mcblock.stackSize"), value: (block.stackSize || 64).toString(), inline: true },
      { name: t("mcblock.hardness"), value: block.hardness?.toString() || t("mcblock.na"), inline: true },
      { name: t("mcblock.resistance"), value: block.resistance?.toString() || t("mcblock.na"), inline: true },
      { name: t("mcblock.luminance"), value: block.luminance?.toString() || "0", inline: true },
      { name: t("mcblock.transparent"), value: block.transparent ? t("mcblock.yes") : t("mcblock.no"), inline: true },
    )
    .setImage(imageUrl);

  // Add crafting recipe button if available
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel(t("mcblock.recipeButton"))
      .setURL(`https://minecraft.wiki/w/${encodeURIComponent(block.name)}`)
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder().setCustomId("block-back").setLabel(t("mcblock.backButton")).setStyle(ButtonStyle.Secondary),
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
      await showBlockMenu(detailMessage, blocks, t);
    }
  });

  collector.on("end", () => {
    detailMessage.edit({ components: [] }).catch(() => {});
  });
}

// (Removed unused handleBlockInteractions function)

export = mcblockCommand;
