import axios from "axios";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType, EmbedBuilder
} from "discord.js";

import i18next from "@shared/i18n";
import { ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";
import { MinecraftServer, Precommand } from "@typings/modules/discord";

const commandMinecraft: Precommand = {
  name: "mcserver",
  nameLocalizations: {
    "es-ES": "mc-servidor",
    "en-US": "mcserver",
  },
  description: "Check the status of a Minecraft server using API v3",
  descriptionLocalizations: {
    "es-ES": "Comprueba el estado de un servidor de Minecraft usando la API v3",
    "en-US": "Check the status of a Minecraft server using API v3",
  },
  examples: ["mcserver <ip>", "mcserver play.example.com", "mcserver 123.45.67.89:25565"],
  nsfw: false,
  category: "Minecraft",
  owner: false,
  aliases: ["minecraft", "mcstatus", "mccheck"],
  botpermissions: ["SendMessages", "EmbedLinks"],
  permissions: ["SendMessages"],
  async execute(_client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;

    // Multilenguaje
    const userLang = message.guild?.preferredLocale || "es-ES";
    const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
    const t = (_client.translations as typeof i18next).getFixedT(lang, "discord");

    // If no arguments, show server input modal
    if (!args[0]) {
      return message.reply({
        embeds: [
          new ErrorEmbed()
            .setTitle(t("mcserver.noInputTitle"))
            .setDescription(t("mcserver.noInputDesc", { prefix, command: "mcserver" }))
            .setFooter({ text: t("mcserver.noInputFooter") }),
        ],
      });
    }

    const serverInput = args[0];
    return fetchAndDisplayServerStatus(message, serverInput, t);
  },
};

/* async function showServerInputModal(message: Message, _prefix: string, t: any) {
  const modal = new ModalBuilder().setCustomId("mcserver_modal").setTitle(t("mcserver.modalTitle"));

  const serverInput = new TextInputBuilder()
    .setCustomId("server_input")
    .setLabel(t("mcserver.inputLabel"))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder(t("mcserver.inputPlaceholder"));

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(serverInput);
  modal.addComponents(firstActionRow);

  await message.showModal(modal);

  // Handle modal submission
  const filter = (interaction: any) => interaction.customId === "mcserver_modal";
  message
    .awaitModalSubmit({ filter, time: 60000 })
    .then(async (interaction: any) => {
      const serverInput = interaction.fields.getTextInputValue("server_input");
      await interaction.deferReply();
      return fetchAndDisplayServerStatus(interaction, serverInput, t);
    })
    .catch(() => {});
}
 */
async function fetchAndDisplayServerStatus(messageOrInteraction: any, serverInput: string, t: any) {
  try {
    // Show loading message
    const loadingEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(t("mcserver.loadingTitle"))
      .setDescription(t("mcserver.loadingDesc", { server: serverInput }))
      .setFooter({ text: t("mcserver.loadingFooter") });

    let loadingMessage;
    // Detect if it's an interaction or a message
    if (messageOrInteraction.isRepliable && messageOrInteraction.isRepliable()) {
      if (!messageOrInteraction.replied && !messageOrInteraction.deferred) {
        await messageOrInteraction.deferReply();
      }
      loadingMessage = await messageOrInteraction.editReply({ embeds: [loadingEmbed] });
    } else {
      loadingMessage = await messageOrInteraction.reply({ embeds: [loadingEmbed] });
    }

    // Fetch server data with User-Agent header
    const response = await axios.get(`https://api.mcsrvstat.us/3/${serverInput}`, {
      headers: {
        "User-Agent": "DiscordBot-MinecraftStatus/1.0 (https://github.com/your-repo)",
      },
    });

    const serverData: MinecraftServer = response.data;

    if (!serverData.online) {
      const offlineEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(t("mcserver.offlineTitle", { server: serverData.hostname || serverInput }))
        .setDescription(t("mcserver.offlineDesc"))
        .addFields(
          { name: t("mcserver.ipField"), value: serverData.ip || t("mcserver.unknown"), inline: true },
          { name: t("mcserver.portField"), value: serverData.port?.toString() || t("mcserver.unknown"), inline: true },
        )
        .setFooter({ text: t("mcserver.offlineFooter") });

      return loadingMessage.edit({ embeds: [offlineEmbed], components: [] });
    }

    // Main server info embed
    const mainEmbed = new EmbedBuilder()
      .setColor("#55FF55")
      .setTitle(`${serverData.hostname || serverInput}`)
      .setDescription(serverData.motd?.clean.join("\n") || t("mcserver.noMotd"))
      .addFields(
        { name: t("mcserver.statusField"), value: t("mcserver.online"), inline: true },
        {
          name: t("mcserver.versionField"),
          value: serverData.protocol?.name
            ? `${serverData.version} (Protocol ${serverData.protocol.version})`
            : serverData.version || t("mcserver.unknown"),
          inline: true,
        },
        { name: t("mcserver.softwareField"), value: serverData.software || t("mcserver.unknown"), inline: true },
        {
          name: t("mcserver.playersField"),
          value: `${serverData.players?.online || 0}/${serverData.players?.max || 0}`,
          inline: true,
        },
        { name: t("mcserver.ipField"), value: serverData.ip, inline: true },
        { name: t("mcserver.portField"), value: serverData.port?.toString() || "25565 (default)", inline: true },
      );

    // Add debug information if available
    if (serverData.debug) {
      mainEmbed.addFields({
        name: t("mcserver.debugField"),
        value: [
          `Ping: ${serverData.debug.ping ? "✅" : "❌"}`,
          `Query: ${serverData.debug.query ? "✅" : "❌"}`,
          `Bedrock: ${serverData.debug.bedrock ? "✅" : "❌"}`,
          `SRV: ${serverData.debug.srv ? "✅" : "❌"}`,
          `Cache: ${serverData.debug.cachehit ? "✅" : "❌"}`,
        ].join(" • "),
        inline: false,
      });
    }

    // Add server icon if available (fixed handling)
    if (serverData.icon) {
      // Remove any duplicate "data:image/png;base64," prefix if present
      /*const cleanIcon = serverData.icon.startsWith("data:image/png;base64,data:image")
        ? serverData.icon.replace("data:image/png;base64,", "")
        : serverData.icon;*/
      //const ImageURLBase64 = `data:image/png;base64,${cleanIcon}`;
      //mainEmbed.setThumbnail(ImageURLBase64);
    }

    // Create buttons for additional info
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("mc_players")
        .setLabel(t("mcserver.playersButton"))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!serverData.players?.list || serverData.players.list.length === 0),
      new ButtonBuilder()
        .setCustomId("mc_plugins")
        .setLabel(t("mcserver.pluginsButton"))
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!serverData.plugins || serverData.plugins.length === 0),
      new ButtonBuilder()
        .setCustomId("mc_mods")
        .setLabel(t("mcserver.modsButton"))
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!serverData.mods || serverData.mods.length === 0),
      new ButtonBuilder()
        .setCustomId("mc_info")
        .setLabel(t("mcserver.infoButton"))
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!serverData.info),
      new ButtonBuilder().setCustomId("mc_refresh").setLabel(t("mcserver.refreshButton")).setStyle(ButtonStyle.Success),
    );

    // Add map info if available
    if (serverData.map) {
      mainEmbed.addFields({
        name: t("mcserver.mapField"),
        value: serverData.map.clean || serverData.map.raw,
        inline: true,
      });
    }

    // Add gamemode for Bedrock servers
    if (serverData.gamemode) {
      mainEmbed.addFields({
        name: t("mcserver.gamemodeField"),
        value: serverData.gamemode,
        inline: true,
      });
    }

    // Add EULA blocked status if available
    if (serverData.eula_blocked !== undefined) {
      mainEmbed.addFields({
        name: t("mcserver.eulaField"),
        value: serverData.eula_blocked ? t("mcserver.yes") : t("mcserver.no"),
        inline: true,
      });
    }

    // Send or edit the message with server info
    await loadingMessage.edit({ embeds: [mainEmbed], components: [buttons] });

    // Rest of the collector code remains the same...
    // Create collector for button interactions
    const collector = loadingMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on("collect", async (interaction: any) => {
      if (!interaction.isButton()) return;
      await interaction.deferUpdate();
      switch (interaction.customId) {
        case "mc_players":
          await showPlayerList(interaction, serverData);
          break;
        case "mc_plugins":
          await showPluginList(interaction, serverData);
          break;
        case "mc_mods":
          await showModList(interaction, serverData);
          break;
        case "mc_info":
          await showServerInfo(interaction, serverData);
          break;
        case "mc_refresh":
          await fetchAndDisplayServerStatus(interaction, serverInput, t);
          break;
      }
    });

    collector.on("end", () => {
      loadingMessage.edit({ components: [] }).catch(() => {});
    });
  } catch (error) {
    console.error("Error fetching Minecraft server:", error);

    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle(t("mcserver.errorTitle"))
      .setDescription(t("mcserver.errorDesc"))
      .setFooter({ text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` });

    // Detect if it's an interaction or a message
    if (messageOrInteraction.isRepliable && messageOrInteraction.isRepliable()) {
      if (!messageOrInteraction.replied && !messageOrInteraction.deferred) {
        await messageOrInteraction.reply({ embeds: [errorEmbed] });
      } else {
        await messageOrInteraction.editReply({ embeds: [errorEmbed] });
      }
    } else {
      await messageOrInteraction.reply({ embeds: [errorEmbed] });
    }
  }
}

async function showPlayerList(interaction: any, serverData: MinecraftServer) {
  // Multilenguaje
  const userLang = interaction.guild?.preferredLocale || "es-ES";
  const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
  const t = interaction.client?.translations?.getFixedT
    ? interaction.client.translations.getFixedT(lang, "discord")
    : (k: string, _v?: any) => k; // fallback

  if (!serverData.players?.list || serverData.players.list.length === 0) {
    const noPlayersEmbed = new EmbedBuilder()
      .setColor("#FFFF55")
      .setTitle(t("mcserver.noPlayersTitle") || "No Players Online")
      .setDescription(t("mcserver.noPlayersDesc") || "There are currently no players online on this server.");

    return interaction.editReply({ embeds: [noPlayersEmbed] });
  }

  // Create paginated player list
  const players = serverData.players.list;
  const pages: EmbedBuilder[] = [];
  const playersPerPage = 10;

  for (let i = 0; i < players.length; i += playersPerPage) {
    const pagePlayers = players.slice(i, i + playersPerPage);

    const playerEmbed = new EmbedBuilder()
      .setColor("#55FF55")
      .setTitle(
        t("mcserver.playersOnlineTitle", {
          count: players.length,
          max: serverData.players.max,
        }) || `Players Online (${players.length}/${serverData.players.max})`,
      )
      .setDescription(pagePlayers.map((p, idx) => `${i + idx + 1}. ${p.name}`).join("\n"))
      .setFooter({
        text:
          t("mcserver.pageFooter", {
            page: Math.floor(i / playersPerPage) + 1,
            total: Math.ceil(players.length / playersPerPage),
          }) || `Page ${Math.floor(i / playersPerPage) + 1}/${Math.ceil(players.length / playersPerPage)}`,
      });

    pages.push(playerEmbed);
  }

  let currentPage = 0;
  const playerListMessage = await interaction.editReply({
    embeds: [pages[currentPage]],
    components: createPaginationButtons(currentPage, pages.length, "players"),
  });

  // Handle pagination
  const paginationCollector = playerListMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  paginationCollector.on("collect", async (pageInteraction: any) => {
    if (!pageInteraction.isButton()) return;

    await pageInteraction.deferUpdate();

    const action = pageInteraction.customId.split("_")[1];

    if (action === "prev" && currentPage > 0) {
      currentPage--;
    } else if (action === "next" && currentPage < pages.length - 1) {
      currentPage++;
    } else if (action === "close") {
      return pageInteraction.deleteReply();
    }

    await pageInteraction.editReply({
      embeds: [pages[currentPage]],
      components: createPaginationButtons(currentPage, pages.length, "players"),
    });
  });

  paginationCollector.on("end", () => {
    playerListMessage.edit({ components: [] }).catch(() => {});
  });
}

async function showPluginList(interaction: any, serverData: MinecraftServer) {
  // Multilenguaje
  const userLang = interaction.guild?.preferredLocale || "es-ES";
  const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
  const t = interaction.client?.translations?.getFixedT
    ? interaction.client.translations.getFixedT(lang, "discord")
    : (k: string, _v?: any) => k; // fallback

  if (!serverData.plugins || serverData.plugins.length === 0) {
    const noPluginsEmbed = new EmbedBuilder()
      .setColor("#FFFF55")
      .setTitle(t("mcserver.noPluginsTitle") || "No Plugins Found")
      .setDescription(
        t("mcserver.noPluginsDesc") || "This server doesn't have any plugins or doesn't expose plugin information.",
      );

    return interaction.editReply({ embeds: [noPluginsEmbed] });
  }

  // Create paginated plugin list
  const plugins = serverData.plugins;
  const pages: EmbedBuilder[] = [];
  const pluginsPerPage = 10;

  for (let i = 0; i < plugins.length; i += pluginsPerPage) {
    const pagePlugins = plugins.slice(i, i + pluginsPerPage);

    const pluginEmbed = new EmbedBuilder()
      .setColor("#55AAFF")
      .setTitle(t("mcserver.pluginsTitle", { count: plugins.length }) || `Server Plugins (${plugins.length} total)`)
      .setDescription(
        pagePlugins.map((p, idx) => `${i + idx + 1}. ${p.name}${p.version ? ` (v${p.version})` : ""}`).join("\n"),
      )
      .setFooter({
        text:
          t("mcserver.pageFooter", {
            page: Math.floor(i / pluginsPerPage) + 1,
            total: Math.ceil(plugins.length / pluginsPerPage),
          }) || `Page ${Math.floor(i / pluginsPerPage) + 1}/${Math.ceil(plugins.length / pluginsPerPage)}`,
      });

    pages.push(pluginEmbed);
  }

  let currentPage = 0;
  const pluginListMessage = await interaction.editReply({
    embeds: [pages[currentPage]],
    components: createPaginationButtons(currentPage, pages.length, "plugins"),
  });

  // Handle pagination
  const paginationCollector = pluginListMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  paginationCollector.on("collect", async (pageInteraction: any) => {
    if (!pageInteraction.isButton()) return;

    await pageInteraction.deferUpdate();

    const action = pageInteraction.customId.split("_")[1];

    if (action === "prev" && currentPage > 0) {
      currentPage--;
    } else if (action === "next" && currentPage < pages.length - 1) {
      currentPage++;
    } else if (action === "close") {
      return pageInteraction.deleteReply();
    }

    await pageInteraction.editReply({
      embeds: [pages[currentPage]],
      components: createPaginationButtons(currentPage, pages.length, "plugins"),
    });
  });

  paginationCollector.on("end", () => {
    pluginListMessage.edit({ components: [] }).catch(() => {});
  });
}

async function showModList(interaction: any, serverData: MinecraftServer) {
  // Multilenguaje
  const userLang = interaction.guild?.preferredLocale || "es-ES";
  const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
  const t = interaction.client?.translations?.getFixedT
    ? interaction.client.translations.getFixedT(lang, "discord")
    : (k: string, _v?: any) => k; // fallback

  if (!serverData.mods || serverData.mods.length === 0) {
    const noModsEmbed = new EmbedBuilder()
      .setColor("#FFFF55")
      .setTitle(t("mcserver.noModsTitle") || "No Mods Found")
      .setDescription(
        t("mcserver.noModsDesc") || "This server doesn't have any mods or doesn't expose mod information.",
      );

    return interaction.editReply({ embeds: [noModsEmbed] });
  }

  // Create paginated mod list
  const mods = serverData.mods;
  const pages: EmbedBuilder[] = [];
  const modsPerPage = 10;

  for (let i = 0; i < mods.length; i += modsPerPage) {
    const pageMods = mods.slice(i, i + modsPerPage);

    const modEmbed = new EmbedBuilder()
      .setColor("#AA55FF")
      .setTitle(t("mcserver.modsTitle", { count: mods.length }) || `Server Mods (${mods.length} total)`)
      .setDescription(
        pageMods.map((m, idx) => `${i + idx + 1}. ${m.name}${m.version ? ` (v${m.version})` : ""}`).join("\n"),
      )
      .setFooter({
        text:
          t("mcserver.pageFooter", {
            page: Math.floor(i / modsPerPage) + 1,
            total: Math.ceil(mods.length / modsPerPage),
          }) || `Page ${Math.floor(i / modsPerPage) + 1}/${Math.ceil(mods.length / modsPerPage)}`,
      });

    pages.push(modEmbed);
  }

  let currentPage = 0;
  const modListMessage = await interaction.editReply({
    embeds: [pages[currentPage]],
    components: createPaginationButtons(currentPage, pages.length, "mods"),
  });

  // Handle pagination
  const paginationCollector = modListMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  paginationCollector.on("collect", async (pageInteraction: any) => {
    if (!pageInteraction.isButton()) return;

    await pageInteraction.deferUpdate();

    const action = pageInteraction.customId.split("_")[1];

    if (action === "prev" && currentPage > 0) {
      currentPage--;
    } else if (action === "next" && currentPage < pages.length - 1) {
      currentPage++;
    } else if (action === "close") {
      return pageInteraction.deleteReply();
    }

    await pageInteraction.editReply({
      embeds: [pages[currentPage]],
      components: createPaginationButtons(currentPage, pages.length, "mods"),
    });
  });

  paginationCollector.on("end", () => {
    modListMessage.edit({ components: [] }).catch(() => {});
  });
}

async function showServerInfo(interaction: any, serverData: MinecraftServer) {
  // Multilenguaje
  const userLang = interaction.guild?.preferredLocale || "es-ES";
  const lang = ["es-ES", "en-US"].includes(userLang) ? userLang : "es-ES";
  const t = interaction.client?.translations?.getFixedT
    ? interaction.client.translations.getFixedT(lang, "discord")
    : (k: string, _v?: any) => k; // fallback

  if (!serverData.info) {
    const noInfoEmbed = new EmbedBuilder()
      .setColor("#FFFF55")
      .setTitle(t("mcserver.noInfoTitle") || "No Additional Info")
      .setDescription(t("mcserver.noInfoDesc") || "This server doesn't provide additional information.");

    return interaction.editReply({ embeds: [noInfoEmbed] });
  }

  const infoEmbed = new EmbedBuilder()
    .setColor("#55AAFF")
    .setTitle(t("mcserver.infoTitle") || "Server Information")
    .setDescription(serverData.info.clean.join("\n"));

  await interaction.editReply({ embeds: [infoEmbed] });
}

function createPaginationButtons(currentPage: number, totalPages: number, type: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${type}_prev`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0),
    new ButtonBuilder()
      .setCustomId(`${type}_next`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages - 1),
    new ButtonBuilder().setCustomId(`${type}_close`).setLabel("✖").setStyle(ButtonStyle.Danger),
  );
}

export default commandMinecraft;
