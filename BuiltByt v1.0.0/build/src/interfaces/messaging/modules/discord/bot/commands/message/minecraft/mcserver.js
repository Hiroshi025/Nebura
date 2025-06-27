"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="8b8b3f20-0d44-5503-8425-6d4e824a4aa9")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const commandMinecraft = {
    name: "mcserver",
    description: "Check the status of a Minecraft server using API v3",
    examples: ["mcserver <ip>", "mcserver play.example.com", "mcserver 123.45.67.89:25565"],
    nsfw: false,
    owner: false,
    aliases: ["minecraft", "mcstatus", "mccheck"],
    botpermissions: ["SendMessages", "EmbedLinks"],
    permissions: ["SendMessages"],
    async execute(_client, message, args, prefix) {
        if (!message.guild || !message.channel || message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        // If no arguments, show server input modal
        if (!args[0]) {
            return showServerInputModal(message, prefix);
        }
        const serverInput = args[0];
        return fetchAndDisplayServerStatus(message, serverInput);
    },
};
async function showServerInputModal(message, _prefix) {
    const modal = new discord_js_1.ModalBuilder().setCustomId("mcserver_modal").setTitle("Check Minecraft Server");
    const serverInput = new discord_js_1.TextInputBuilder()
        .setCustomId("server_input")
        .setLabel("Server IP or Domain (with port if needed)")
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder("play.example.com or 123.45.67.89:25565");
    const firstActionRow = new discord_js_1.ActionRowBuilder().addComponents(serverInput);
    modal.addComponents(firstActionRow);
    await message.showModal(modal);
    // Handle modal submission
    const filter = (interaction) => interaction.customId === "mcserver_modal";
    message
        .awaitModalSubmit({ filter, time: 60000 })
        .then(async (interaction) => {
        const serverInput = interaction.fields.getTextInputValue("server_input");
        await interaction.deferReply();
        return fetchAndDisplayServerStatus(interaction, serverInput);
    })
        .catch(() => { });
}
async function fetchAndDisplayServerStatus(messageOrInteraction, serverInput) {
    try {
        // Show loading message
        const loadingEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FFA500")
            .setTitle("Checking Minecraft Server")
            .setDescription(`Querying ${serverInput}...`)
            .setFooter({ text: "This may take a few seconds" });
        let loadingMessage;
        // Detect if it's an interaction or a message
        if (messageOrInteraction.isRepliable && messageOrInteraction.isRepliable()) {
            // If it's an interaction and not yet replied, defer if needed
            if (!messageOrInteraction.replied && !messageOrInteraction.deferred) {
                await messageOrInteraction.deferReply();
            }
            loadingMessage = await messageOrInteraction.editReply({ embeds: [loadingEmbed] });
        }
        else {
            loadingMessage = await messageOrInteraction.reply({ embeds: [loadingEmbed] });
        }
        // Fetch server data with User-Agent header
        const response = await axios_1.default.get(`https://api.mcsrvstat.us/3/${serverInput}`, {
            headers: {
                "User-Agent": "DiscordBot-MinecraftStatus/1.0 (https://github.com/your-repo)",
            },
        });
        const serverData = response.data;
        if (!serverData.online) {
            const offlineEmbed = new discord_js_1.EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(`${serverData.hostname || serverInput} is offline`)
                .setDescription("The server could not be reached or is currently offline.")
                .addFields({ name: "IP", value: serverData.ip || "Unknown", inline: true }, { name: "Port", value: serverData.port?.toString() || "Unknown", inline: true })
                .setFooter({ text: "Try again later or check the server address" });
            return loadingMessage.edit({ embeds: [offlineEmbed], components: [] });
        }
        // Main server info embed
        const mainEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#55FF55")
            .setTitle(`${serverData.hostname || serverInput}`)
            .setDescription(serverData.motd?.clean.join("\n") || "No MOTD available")
            .addFields({ name: "Status", value: "🟢 Online", inline: true }, {
            name: "Version",
            value: serverData.protocol?.name
                ? `${serverData.version} (Protocol ${serverData.protocol.version})`
                : serverData.version || "Unknown",
            inline: true,
        }, { name: "Software", value: serverData.software || "Unknown", inline: true }, {
            name: "Players",
            value: `${serverData.players?.online || 0}/${serverData.players?.max || 0}`,
            inline: true,
        }, { name: "IP", value: serverData.ip, inline: true }, { name: "Port", value: serverData.port?.toString() || "25565 (default)", inline: true });
        // Add debug information if available
        if (serverData.debug) {
            mainEmbed.addFields({
                name: "Debug Info",
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
        // Rest of the function remains the same...
        // Create buttons for additional info
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("mc_players")
            .setLabel("View Players")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setDisabled(!serverData.players?.list || serverData.players.list.length === 0), new discord_js_1.ButtonBuilder()
            .setCustomId("mc_plugins")
            .setLabel("View Plugins")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(!serverData.plugins || serverData.plugins.length === 0), new discord_js_1.ButtonBuilder()
            .setCustomId("mc_mods")
            .setLabel("View Mods")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(!serverData.mods || serverData.mods.length === 0), new discord_js_1.ButtonBuilder()
            .setCustomId("mc_info")
            .setLabel("Server Info")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(!serverData.info), new discord_js_1.ButtonBuilder()
            .setCustomId("mc_refresh")
            .setLabel("Refresh")
            .setStyle(discord_js_1.ButtonStyle.Success));
        // Add map info if available
        if (serverData.map) {
            mainEmbed.addFields({
                name: "Current Map",
                value: serverData.map.clean || serverData.map.raw,
                inline: true,
            });
        }
        // Add gamemode for Bedrock servers
        if (serverData.gamemode) {
            mainEmbed.addFields({
                name: "Gamemode",
                value: serverData.gamemode,
                inline: true,
            });
        }
        // Add EULA blocked status if available
        if (serverData.eula_blocked !== undefined) {
            mainEmbed.addFields({
                name: "EULA Blocked",
                value: serverData.eula_blocked ? "Yes" : "No",
                inline: true,
            });
        }
        // Send or edit the message with server info
        await loadingMessage.edit({ embeds: [mainEmbed], components: [buttons] });
        // Rest of the collector code remains the same...
        // Create collector for button interactions
        const collector = loadingMessage.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            time: 60000,
        });
        collector.on("collect", async (interaction) => {
            if (!interaction.isButton())
                return;
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
                    await fetchAndDisplayServerStatus(interaction, serverInput);
                    break;
            }
        });
        collector.on("end", () => {
            loadingMessage.edit({ components: [] }).catch(() => { });
        });
    }
    catch (error) {
        console.error("Error fetching Minecraft server:", error);
        const errorEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Error Checking Server")
            .setDescription("Failed to retrieve server information. Please check the server address and try again.")
            .setFooter({ text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` });
        // Detect if it's an interaction or a message
        if (messageOrInteraction.isRepliable && messageOrInteraction.isRepliable()) {
            if (!messageOrInteraction.replied && !messageOrInteraction.deferred) {
                await messageOrInteraction.reply({ embeds: [errorEmbed] });
            }
            else {
                await messageOrInteraction.editReply({ embeds: [errorEmbed] });
            }
        }
        else {
            await messageOrInteraction.reply({ embeds: [errorEmbed] });
        }
    }
}
async function showPlayerList(interaction, serverData) {
    if (!serverData.players?.list || serverData.players.list.length === 0) {
        const noPlayersEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FFFF55")
            .setTitle("No Players Online")
            .setDescription("There are currently no players online on this server.");
        return interaction.editReply({ embeds: [noPlayersEmbed] });
    }
    // Create paginated player list
    const players = serverData.players.list;
    const pages = [];
    const playersPerPage = 10;
    for (let i = 0; i < players.length; i += playersPerPage) {
        const pagePlayers = players.slice(i, i + playersPerPage);
        const playerEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#55FF55")
            .setTitle(`Players Online (${players.length}/${serverData.players.max})`)
            .setDescription(pagePlayers.map((p, idx) => `${i + idx + 1}. ${p.name}`).join("\n"))
            .setFooter({
            text: `Page ${Math.floor(i / playersPerPage) + 1}/${Math.ceil(players.length / playersPerPage)}`,
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
        componentType: discord_js_1.ComponentType.Button,
        time: 60000,
    });
    paginationCollector.on("collect", async (pageInteraction) => {
        if (!pageInteraction.isButton())
            return;
        await pageInteraction.deferUpdate();
        const action = pageInteraction.customId.split("_")[1];
        if (action === "prev" && currentPage > 0) {
            currentPage--;
        }
        else if (action === "next" && currentPage < pages.length - 1) {
            currentPage++;
        }
        else if (action === "close") {
            return pageInteraction.deleteReply();
        }
        await pageInteraction.editReply({
            embeds: [pages[currentPage]],
            components: createPaginationButtons(currentPage, pages.length, "players"),
        });
    });
    paginationCollector.on("end", () => {
        playerListMessage.edit({ components: [] }).catch(() => { });
    });
}
async function showPluginList(interaction, serverData) {
    if (!serverData.plugins || serverData.plugins.length === 0) {
        const noPluginsEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FFFF55")
            .setTitle("No Plugins Found")
            .setDescription("This server doesn't have any plugins or doesn't expose plugin information.");
        return interaction.editReply({ embeds: [noPluginsEmbed] });
    }
    // Create paginated plugin list
    const plugins = serverData.plugins;
    const pages = [];
    const pluginsPerPage = 10;
    for (let i = 0; i < plugins.length; i += pluginsPerPage) {
        const pagePlugins = plugins.slice(i, i + pluginsPerPage);
        const pluginEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#55AAFF")
            .setTitle(`Server Plugins (${plugins.length} total)`)
            .setDescription(pagePlugins
            .map((p, idx) => `${i + idx + 1}. ${p.name}${p.version ? ` (v${p.version})` : ""}`)
            .join("\n"))
            .setFooter({
            text: `Page ${Math.floor(i / pluginsPerPage) + 1}/${Math.ceil(plugins.length / pluginsPerPage)}`,
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
        componentType: discord_js_1.ComponentType.Button,
        time: 60000,
    });
    paginationCollector.on("collect", async (pageInteraction) => {
        if (!pageInteraction.isButton())
            return;
        await pageInteraction.deferUpdate();
        const action = pageInteraction.customId.split("_")[1];
        if (action === "prev" && currentPage > 0) {
            currentPage--;
        }
        else if (action === "next" && currentPage < pages.length - 1) {
            currentPage++;
        }
        else if (action === "close") {
            return pageInteraction.deleteReply();
        }
        await pageInteraction.editReply({
            embeds: [pages[currentPage]],
            components: createPaginationButtons(currentPage, pages.length, "plugins"),
        });
    });
    paginationCollector.on("end", () => {
        pluginListMessage.edit({ components: [] }).catch(() => { });
    });
}
async function showModList(interaction, serverData) {
    if (!serverData.mods || serverData.mods.length === 0) {
        const noModsEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FFFF55")
            .setTitle("No Mods Found")
            .setDescription("This server doesn't have any mods or doesn't expose mod information.");
        return interaction.editReply({ embeds: [noModsEmbed] });
    }
    // Create paginated mod list
    const mods = serverData.mods;
    const pages = [];
    const modsPerPage = 10;
    for (let i = 0; i < mods.length; i += modsPerPage) {
        const pageMods = mods.slice(i, i + modsPerPage);
        const modEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#AA55FF")
            .setTitle(`Server Mods (${mods.length} total)`)
            .setDescription(pageMods
            .map((m, idx) => `${i + idx + 1}. ${m.name}${m.version ? ` (v${m.version})` : ""}`)
            .join("\n"))
            .setFooter({
            text: `Page ${Math.floor(i / modsPerPage) + 1}/${Math.ceil(mods.length / modsPerPage)}`,
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
        componentType: discord_js_1.ComponentType.Button,
        time: 60000,
    });
    paginationCollector.on("collect", async (pageInteraction) => {
        if (!pageInteraction.isButton())
            return;
        await pageInteraction.deferUpdate();
        const action = pageInteraction.customId.split("_")[1];
        if (action === "prev" && currentPage > 0) {
            currentPage--;
        }
        else if (action === "next" && currentPage < pages.length - 1) {
            currentPage++;
        }
        else if (action === "close") {
            return pageInteraction.deleteReply();
        }
        await pageInteraction.editReply({
            embeds: [pages[currentPage]],
            components: createPaginationButtons(currentPage, pages.length, "mods"),
        });
    });
    paginationCollector.on("end", () => {
        modListMessage.edit({ components: [] }).catch(() => { });
    });
}
async function showServerInfo(interaction, serverData) {
    if (!serverData.info) {
        const noInfoEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#FFFF55")
            .setTitle("No Additional Info")
            .setDescription("This server doesn't provide additional information.");
        return interaction.editReply({ embeds: [noInfoEmbed] });
    }
    const infoEmbed = new discord_js_1.EmbedBuilder()
        .setColor("#55AAFF")
        .setTitle("Server Information")
        .setDescription(serverData.info.clean.join("\n"));
    await interaction.editReply({ embeds: [infoEmbed] });
}
function createPaginationButtons(currentPage, totalPages, type) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`${type}_prev`)
        .setLabel("◀")
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(currentPage === 0), new discord_js_1.ButtonBuilder()
        .setCustomId(`${type}_next`)
        .setLabel("▶")
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1), new discord_js_1.ButtonBuilder().setCustomId(`${type}_close`).setLabel("✖").setStyle(discord_js_1.ButtonStyle.Danger));
}
module.exports = commandMinecraft;
//# sourceMappingURL=mcserver.js.map
//# debugId=8b8b3f20-0d44-5503-8425-6d4e824a4aa9
