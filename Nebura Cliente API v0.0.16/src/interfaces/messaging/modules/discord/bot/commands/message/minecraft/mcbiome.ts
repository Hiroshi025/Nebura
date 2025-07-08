import axios from "axios";
import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";

import emojis from "@config/json/emojis.json";
import { Pagination } from "@discordx/pagination";
import { Precommand } from "@typings/modules/discord";
import { ErrorEmbed } from "@utils/extends/embeds.extension";

const mcbiomeCommand: Precommand = {
  name: "mcbiome",
  nameLocalizations: {
    "es-ES": "mcbioma",
    "en-US": "mcbiome",
  },
  description: "Show information about a Minecraft biome",
  descriptionLocalizations: {
    "es-ES": "Mostrar información sobre un bioma de Minecraft",
    "en-US": "Show information about a Minecraft biome",
  },
  examples: ["mcbiome [name]", "mcbiome list"],
  nsfw: false,
  owner: false,
  cooldown: 5,
  category: "Minecraft",
  aliases: ["minecraftbiome"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(_client, message, args, prefix) {
    try {
      if (!message.guild) return;

    // Multilenguaje
    const userLang = message.guild?.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = _client.translations.getFixedT(lang, "discord");

      // Fetch biomes from Mojang API
      const response = await axios.get(
        "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.20/biomes.json",
      );
      const biomes = response.data;

      const biomeName = args.join(" ");

      if (!biomeName) {
        return await showBiomeMenu(message, biomes, t);
      }

      if (biomeName.toLowerCase() === "list") {
        return await showBiomeList(message, biomes, t);
      }

      const biome = findBiome(biomeName, biomes);

      if (!biome) {
        return message.reply({
          embeds: [new EmbedBuilder().setColor("Red").setDescription(`${emojis.error} ${t("notFound", { prefix })}`)],
        });
      }

      return await showBiomeDetails(message, biome, t);
    } catch (e: any) {
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setErrorFormat(e.stack),
        ],
      });
    }
  },
};

async function showBiomeMenu(message: any, biomes: any[], t: (key: string, options?: any) => string) {
  const selectMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("biome-select")
      .setPlaceholder(t("menuPlaceholder"))
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
        .setTitle(t("menuTitle"))
        .setDescription(t("menuDesc"))
        .setThumbnail("https://www.minecraft.net/content/dam/minecraft/touchup-2020/minecraft-logo.svg"),
    ],
    components: [selectMenu],
  });
}

async function showBiomeList(message: any, biomes: any[], t: (key: string, options?: any) => string) {
  const pages = [];
  const itemsPerPage = 5;

  for (let i = 0; i < biomes.length; i += itemsPerPage) {
    const current = biomes.slice(i, i + itemsPerPage);

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle(t("listTitle"))
      .setDescription(t("listDesc"))
      .setThumbnail("https://www.minecraft.net/content/dam/minecraft/touchup-2020/minecraft-logo.svg")
      .setFooter({
        text: t("pageFooter", {
          page: Math.floor(i / itemsPerPage) + 1,
          total: Math.ceil(biomes.length / itemsPerPage),
        }),
      });

    current.forEach((biome) => {
      embed.addFields({
        name: biome.name,
        value: `**${t("category")}** ${biome.category}\n**${t("id")}** ${biome.id}`,
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

async function showBiomeDetails(message: any, biome: any, t: (key: string, options?: any) => string) {
  // Get biome image from Minecraft API
  const imageUrl = `https://minecraft-api.com/api/biomes/${encodeURIComponent(biome.name)}.png`;

  const embed = new EmbedBuilder()
    .setColor("#2ECC71")
    .setTitle(`${t("detailTitle")}: ${biome.name}`)
    .setDescription(`**${t("category")}** ${biome.category}`)
    .addFields(
      {
        name: t("detailField"),
        value: `**${t("id")}** ${biome.id}\n**${t("temperature")}** ${biome.temperature}\n**${t("hasPrecipitation")}** ${biome.has_precipitation}\n**${t("dimension")}** ${biome.dimension}`,
        inline: false,
      },
      {
        name: t("displayField"),
        value: `**${t("displayName")}** ${biome.displayName}\n**${t("color")}** ${biome.color}`,
        inline: false,
      },
    )
    .setImage(imageUrl);

  await message.reply({ embeds: [embed] });
}

export = mcbiomeCommand;
