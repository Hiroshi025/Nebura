"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="d2054555-1717-5b71-a69e-111984208d22")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const main_1 = require("../../../../../../main");
const config_1 = require("../../../../../../shared/utils/config");
const console_1 = require("../../../../../../shared/utils/functions/console");
const package_json_1 = __importDefault(require("../../../../../../../package.json"));
const addons_1 = require("../../structure/addons");
const config_2 = __importDefault(require("./config"));
exports.default = new addons_1.Addons({
    name: "Advanced Minecraft Status Handler",
    description: "Advanced status monitoring for multiple Minecraft servers",
    author: package_json_1.default.author,
    version: package_json_1.default.version,
    bitfield: ["ManageChannels", "SendMessages", "EmbedLinks"],
}, async () => {
    // Cache for server statuses
    const statusCache = {};
    let lastApiResponseTime = 0;
    let errorCount = 0;
    let lastError = null;
    /**
     * Fetches server status from API with proper error handling
     */
    async function fetchServerStatus(server) {
        try {
            const apiUrl = server.type === "bedrock"
                ? `https://api.mcsrvstat.us/bedrock/3/${server.ip}${server.port ? `:${server.port}` : ""}`
                : `https://api.mcsrvstat.us/3/${server.ip}${server.port ? `:${server.port}` : ""}`;
            const apiStartTime = Date.now();
            const response = await axios_1.default.get(apiUrl, {
                timeout: config_2.default.timeout,
                headers: {
                    "User-Agent": `DiscordBot/${package_json_1.default.version} (${package_json_1.default.author})`,
                },
            });
            lastApiResponseTime = Date.now() - apiStartTime;
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    throw new Error(`API Error: ${error.response.status} ${error.response.statusText}`);
                }
                else if (error.request) {
                    throw new Error("API request timed out or failed to connect");
                }
                else {
                    throw new Error(`API configuration error: ${error.message}`);
                }
            }
            else {
                throw new Error(`Unexpected error: ${error.message}`);
            }
        }
    }
    /**
     * Creates a rich embed with server status information
     */
    function createStatusEmbed(serverConfig, statusData) {
        const isOnline = statusData?.online === true;
        const embedColor = isOnline ? 0x00ff00 : 0xff0000;
        const statusText = isOnline ? "ONLINE" : "OFFLINE";
        const statusEmoji = isOnline
            ? main_1.client.getEmoji(config_1.config.modules.discord.guildId, "online") || "🟢"
            : main_1.client.getEmoji(config_1.config.modules.discord.guildId, "offline") || "🔴";
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${statusEmoji} ${serverConfig.displayName || serverConfig.name} - ${statusText}`)
            .setDescription(serverConfig.description || "No description provided")
            .setFooter({
            text: `Last updated: ${new Date().toLocaleString()} | API response: ${lastApiResponseTime}ms`,
            iconURL: main_1.client.user?.displayAvatarURL(),
        })
            .setTimestamp();
        // Basic server info
        embed.addFields({
            name: "🔗 Connection Info",
            value: [
                `**Address:** \`${statusData.ip || serverConfig.ip}\``,
                `**Port:** \`${statusData.port || serverConfig.port || "default"}\``,
                `**Type:** ${serverConfig.type.toUpperCase()}`,
            ].join("\n"),
            inline: true,
        });
        if (isOnline) {
            // Version info
            embed.addFields({
                name: "📋 Version Info",
                value: [
                    `**Version:** ${statusData.version || "Unknown"}`,
                    `**Protocol:** ${statusData.protocol?.name || statusData.protocol?.version || "Unknown"}`,
                    `**Software:** ${statusData.software || "Vanilla"}`,
                ].join("\n"),
                inline: true,
            });
            // Players info
            const players = statusData.players || {};
            const playerCount = `${players.online || 0}/${players.max || 0}`;
            const playerList = players.list
                ?.slice(0, 10)
                .map((p) => `• ${p.name}`)
                .join("\n") || "No players online";
            embed.addFields({
                name: `👥 Players (${playerCount})`,
                value: playerList.length > 1000 ? playerList.substring(0, 1000) + "..." : playerList,
                inline: false,
            });
            // MOTD
            if (statusData.motd?.clean) {
                embed.addFields({
                    name: "📜 MOTD",
                    value: statusData.motd.clean.join("\n").slice(0, 1024),
                    inline: false,
                });
            }
            // Server icon if available
            if (statusData.icon) {
                embed.setThumbnail(`https://api.mcsrvstat.us/icon/${serverConfig.ip}${serverConfig.port ? `:${serverConfig.port}` : ""}`);
            }
        }
        else {
            embed.addFields({
                name: "🔍 Debug Info",
                value: [
                    `**Last Error:** ${lastError || "None"}`,
                    `**Error Count:** ${errorCount}`,
                    `**Cache Status:** ${statusData.debug?.cachehit ? "HIT" : "MISS"}`,
                ].join("\n"),
                inline: false,
            });
        }
        return embed;
    }
    /**
     * Creates interactive components for the message
     */
    function createMessageComponents(servers, currentServer) {
        // Server selection dropdown
        const serverSelect = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("minecraft_server_select")
            .setPlaceholder("Select a server...")
            .addOptions(servers.map((server) => new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel(server.displayName || server.name)
            .setDescription(server.description?.slice(0, 50) || "")
            .setValue(server.name)
            .setDefault(server.name === currentServer)));
        // Action buttons
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("refresh_status")
            .setLabel("Refresh")
            .setEmoji("🔄")
            .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setLabel("API Docs")
            .setEmoji("📄")
            .setURL("https://api.mcsrvstat.us/"));
        return [new discord_js_1.ActionRowBuilder().addComponents(serverSelect), buttons];
    }
    /**
     * Updates the status message in Discord
     */
    async function updateStatusMessage(serverName) {
        try {
            const serverConfig = config_2.default.servers.find((s) => s.name === serverName);
            if (!serverConfig)
                throw new Error(`Server config not found: ${serverName}`);
            // Fetch channel and validate
            const channel = (await main_1.main.discord.channels.fetch(config_2.default.channelId));
            if (!channel?.isTextBased())
                throw new Error("Invalid channel");
            // Get server status
            let statusData;
            try {
                statusData = await fetchServerStatus(serverConfig);
                statusCache[serverName] = statusData;
                errorCount = 0;
                lastError = null;
            }
            catch (error) {
                errorCount++;
                lastError = error.message;
                (0, console_1.logWithLabel)("error", `Error fetching status for ${serverName}: ${error.message}`, {
                    customLabel: "Minecraft",
                    context: { server: serverName, errorCount },
                });
                // Use cached data if available
                statusData = statusCache[serverName] || { online: false };
            }
            // Create embed and components
            const embed = createStatusEmbed(serverConfig, statusData);
            const components = createMessageComponents(config_2.default.servers, serverName);
            // Calculate uptime percentage (simplified)
            const uptimePercentage = statusData.online ? "100%" : "0%";
            // Message content
            const content = [
                `## ${serverConfig.displayName || serverConfig.name} Status`,
                `**Uptime:** ${uptimePercentage} | **Errors:** ${errorCount}`,
                `**Last Update:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            ].join("\n");
            // Try to edit existing message or send new one
            let message;
            if (config_2.default.messageId) {
                try {
                    message = await channel.messages.fetch(config_2.default.messageId);
                    if (message.author.id !== main_1.client.user?.id) {
                        throw new Error("Message not owned by bot");
                    }
                    await message.edit({ content, embeds: [embed], components });
                }
                catch {
                    // If message doesn't exist or can't be edited, send new one
                    message = await channel.send({ content, embeds: [embed], components });
                    config_2.default.messageId = message.id;
                }
            }
            else {
                message = await channel.send({ content, embeds: [embed], components });
                config_2.default.messageId = message.id;
            }
            return message;
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Failed to update status message: ${error.message}`, {
                customLabel: "Minecraft",
                context: { server: serverName, error: error.stack },
            });
            throw error;
        }
    }
    /**
     * Main function to initialize the status monitoring
     */
    async function initializeStatusHandler() {
        if (!config_2.default.enabled)
            return;
        // Initial status update
        try {
            await updateStatusMessage(config_2.default.defaultServer || config_2.default.servers[0].name);
            (0, console_1.logWithLabel)("info", "Initial Minecraft server status update completed");
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Initial status update failed: ${error.message}`);
        }
        // Set up periodic updates
        setInterval(async () => {
            try {
                await updateStatusMessage(config_2.default.defaultServer || config_2.default.servers[0].name);
            }
            catch (error) {
                console.error("Periodic status update failed:", error);
            }
        }, config_2.default.updateInterval);
        // Set up interaction handling
        main_1.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isStringSelectMenu() && !interaction.isButton())
                return;
            if (!["minecraft_server_select", "refresh_status"].includes(interaction.customId))
                return;
            await interaction.deferUpdate();
            try {
                if (interaction.isStringSelectMenu()) {
                    // Server selection changed
                    const selectedServer = interaction.values[0];
                    await updateStatusMessage(selectedServer);
                }
                else if (interaction.isButton() && interaction.customId === "refresh_status") {
                    // Refresh button clicked
                    const currentServer = config_2.default.defaultServer || config_2.default.servers[0].name;
                    await updateStatusMessage(currentServer);
                }
            }
            catch (error) {
                (0, console_1.logWithLabel)("error", `Interaction handling failed: ${error}`);
                await interaction.followUp({
                    content: "❌ Failed to update status. Please try again later.",
                    flags: "Ephemeral",
                });
            }
        });
    }
    // Start the status handler
    initializeStatusHandler().catch((error) => {
        (0, console_1.logWithLabel)("error", `Failed to initialize Minecraft status handler: ${error.message}`);
    });
});
//# sourceMappingURL=minecraft.addon.js.map
//# debugId=d2054555-1717-5b71-a69e-111984208d22
