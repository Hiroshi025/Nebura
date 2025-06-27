import axios from "axios";
import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";

import { ErrorEmbed } from "@/shared/adapters/extends/embeds.extend";
import emojis from "@config/json/emojis.json";
import { Pagination } from "@discordx/pagination";
import { Precommand } from "@typings/modules/discord";

const mcbiomeCommand: Precommand = {
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
      if (!message.guild) return;

      // Fetch biomes from Mojang API
      const response = await axios.get(
        "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.20/biomes.json",
      );
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
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                `${emojis.error} Biome not found. Use \`${prefix}mcbiome list\` to see available biomes.`,
              ),
          ],
        });
      }

      return await showBiomeDetails(message, biome);
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

async function showBiomeMenu(message: any, biomes: any[]) {
  const selectMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("biome-select")
      .setPlaceholder("Select a biome")
      .addOptions(
        biomes.map((biome) => ({
          label: biome.name,
          value: biome.id.toString(),
          description: biome.category,
        })),
      ),
  );

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("Minecraft Biomes")
        .setDescription("Select a biome from the menu below")
        .setThumbnail("https://www.minecraft.net/content/dam/minecraft/touchup-2020/minecraft-logo.svg"),
    ],
    components: [selectMenu],
  });
}

async function showBiomeList(message: any, biomes: any[]) {
  const pages = [];
  const itemsPerPage = 5;

  for (let i = 0; i < biomes.length; i += itemsPerPage) {
    const current = biomes.slice(i, i + itemsPerPage);

    const embed = new EmbedBuilder()
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

  const pagination = new Pagination(message, pages);
  await pagination.send();
}

function findBiome(name: string, biomes: any[]) {
  const lowerName = name.toLowerCase();
  return biomes.find((biome) => biome.name.toLowerCase().includes(lowerName) || biome.id === name);
}

async function showBiomeDetails(message: any, biome: any) {
  // Get biome image from Minecraft API
  const imageUrl = `https://minecraft-api.com/api/biomes/${encodeURIComponent(biome.name)}.png`;

  const embed = new EmbedBuilder()
    .setColor("#2ECC71")
    .setTitle(`Biome: ${biome.name}`)
    .setDescription(`**Category:** ${biome.category}`)
    .addFields(
      {
        name: "Biome Details",
        value: `**ID:** ${biome.id}\n**Temperature:** ${biome.temperature}\n**Has Precipitation:** ${biome.has_precipitation}\n**Dimension:** ${biome.dimension}`,
        inline: false,
      },
      {
        name: "Display Information",
        value: `**Display Name:** ${biome.displayName}\n**Color Code:** ${biome.color}`,
        inline: false,
      },
    )
    .setImage(imageUrl);

  await message.reply({ embeds: [embed] });
}

export = mcbiomeCommand;
