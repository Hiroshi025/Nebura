"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
// import puppeteer from "puppeteer"; // Comentado temporalmente
const main_1 = require("../../../main");
const config_1 = require("../../../shared/utils/config");
const console_1 = require("../../../shared/utils/functions/console");
const emojis_json_1 = __importDefault(require("../../../../config/json/emojis.json"));
const package_json_1 = __importDefault(require("../../../../package.json"));
const addons_1 = require("../structure/addons");
/**
 * ############################################################################
 * #
 * # Advertencia: Addon Warning.
 * # La configuracion de addon de estado es obligatoria el apartado messageid
 * # aun que si es posible no agregarlo se recomienda agregar la id ya que en caso de reiniciar el bot
 * # el bot no podra editar el mensaje de estado y tendra que volver a enviar uno nuevo.
 * #
 * ############################################################################
 */
exports.default = new addons_1.Addons({
    name: "Status Handler",
    description: "Status handler for the project",
    author: package_json_1.default.author,
    version: package_json_1.default.version,
    bitfield: ["ManageChannels"],
}, async () => {
    // Configuration object for the status handler
    const configuration = {
        enabled: false,
        timeout: 60000,
        website: "",
        messageid: "",
        channelid: "",
        minecraftserver: {
            type: "java",
            ip: "",
            port: 25565,
            api: "https://api.mcsrvstat.us/3/",
        },
    };
    // Main function to handle status updates
    async function Main() {
        let status = false; // Tracks the server status (online/offline)
        const startTime = Date.now(); // Tracks the start time for elapsed time calculations
        /**
         * Function to update the server status and send/edit the Discord message.
         */
        const updateStatus = async () => {
            try {
                const apiStartTime = Date.now(); // Start time for API response time calculation
                const res = await (0, axios_1.default)({
                    method: "GET",
                    baseURL: configuration.minecraftserver.api,
                    url: configuration.minecraftserver.ip,
                    headers: {
                        "User-Agent": `DiscordBot ${package_json_1.default.version} (${package_json_1.default.author})`,
                    },
                });
                const apiResponseTime = Date.now() - apiStartTime; // Calculate API response time
                // Validate response data
                if (!res.data) {
                    (0, console_1.logWithLabel)("error", "API response is empty or invalid.", "Status Handler");
                    return;
                }
                // Generate image from HTML (motd.html) - Comentado temporalmente
                /*
                let attachment: AttachmentBuilder | null = null;
                if (res.data.motd?.html) {
                  const browser = await puppeteer.launch();
                  const page = await browser.newPage();
                  await page.setContent(res.data.motd.html, { waitUntil: "networkidle0" });
                  const screenshotBuffer = await page.screenshot({ encoding: "base64" });
                  await browser.close();
      
                  // Create an attachment from the buffer
                  attachment = new AttachmentBuilder(Buffer.from(screenshotBuffer, "base64"), {
                    name: "motd_image.png",
                  });
                }
                */
                // Determine server status based on API response
                if (res.status === 200 && res.data.online !== undefined) {
                    status = res.data.online;
                }
                else {
                    (0, console_1.logWithLabel)("error", `Unexpected API response: ${JSON.stringify(res.data, null, 2)}`, "Status Handler");
                    status = false;
                }
                if (!status) {
                    (0, console_1.logWithLabel)("custom", "Server is offline.", "Status Handler");
                    return;
                }
                // Create an embed with server information
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle(` ${main_1.client.getEmoji(config_1.config.project.guildId, "online")} Status Handler [Minecraft Configuration]`)
                    .setFooter({
                    text: `Response: ${apiResponseTime}ms | Node.js: ${process.versions.node}`,
                    iconURL: main_1.client.user?.displayAvatarURL() || "",
                })
                    .setTimestamp()
                    .setAuthor({
                    name: `Status Handler - ${configuration.minecraftserver.ip}`,
                    iconURL: main_1.client.user?.displayAvatarURL() || "",
                })
                    .setColor(0x00ff00) // Green color for online status
                    .setDescription([
                    `> **Server IP:** ${res.data.ip || "Unknown"} (\`${res.data.port}\`)`,
                    `> **Hostname:** ${res.data.hostname || "No hostname detected"}\n`,
                ].join("\n"));
                // Add the image to the embed if available - Comentado temporalmente
                /*
                if (attachment) {
                  embed.setImage(`attachment://${attachment.name}`);
                }
                */
                // Add additional fields based on server online status
                if (res.data.online) {
                    embed.setFields({
                        name: "__Server Information__",
                        value: [
                            `> **Server Version:** ${res.data.version || "Unknown"}`,
                            `> **Server Software:** ${res.data.software || "No software"}`,
                            `> **Server Gamemode:** ${res.data.gamemode || "No gamemode"}`,
                        ].join("\n"),
                        inline: true,
                    }, {
                        name: "__Server Players__",
                        value: [
                            `> **Players Online:** ${res.data.players?.online || 0} (\`${res.data.players?.list?.length || 0}\`)`,
                            `> **Max Players:** ${res.data.players?.max || 0} (\`${res.data.players?.max || 0}\`)`,
                            `> **Players List:** ${res.data.players?.list || "No players"}`,
                        ].join("\n"),
                        inline: true,
                    });
                }
                else {
                    embed
                        .setFields({
                        name: `${main_1.client.getEmoji(config_1.config.project.guildId, "offline")} Server Status [Offline]`,
                        value: [
                            `> **Datetime:** ${new Date().toLocaleString()}`,
                            `> **Server IP:** ${res.data.ip || "Unknown"}`,
                        ].join("\n"),
                        inline: true,
                    })
                        .setColor(0xff0000); // Red color for offline status
                }
                const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setStyle(discord_js_1.ButtonStyle.Link)
                    .setLabel("API")
                    .setEmoji(emojis_json_1.default.minecraft.server_ip)
                    .setURL(configuration.minecraftserver.api + configuration.minecraftserver.ip), new discord_js_1.ButtonBuilder()
                    .setStyle(discord_js_1.ButtonStyle.Link)
                    .setLabel("Website")
                    .setEmoji(emojis_json_1.default.minecraft.server_seed)
                    .setURL(configuration.website));
                // Fetch the Discord channel
                const channel = (await main_1.main.discord.channels.fetch(configuration.channelid));
                if (!channel?.isTextBased())
                    throw new Error("Invalid channel");
                // Fetch the existing message or send a new one
                let message = await channel.messages.fetch(configuration.messageid).catch(() => null);
                if (!main_1.client.user)
                    throw new Error("User not found");
                if (!message || message == null) {
                    (0, console_1.logWithLabel)("custom", "Message not found, sending a new one.", "Status");
                    // Send a new message if the existing one is not found or invalid
                    message = await channel.send({
                        content: [
                            `Status updated by: ${main_1.client.user?.tag}`,
                            `Time since last update: N/A`,
                            `API Response Time: ${apiResponseTime}ms`,
                            `Errors: None`,
                        ].join("\n"),
                        embeds: [embed],
                        components: [buttons],
                        // files: attachment ? [attachment] : [], // Comentado temporalmente
                    });
                    configuration.messageid = message.id; // Save the new message ID
                }
                if (message.author !== main_1.client.user) {
                    (0, console_1.logWithLabel)("custom", "Message author mismatch, sending a new one.", "Status");
                    // Send a new message if the existing one is not found or invalid
                    message = await channel.send({
                        content: [
                            `Status updated by: ${main_1.client.user?.tag}`,
                            `Time since last update: N/A`,
                            `API Response Time: ${apiResponseTime}ms`,
                            `Errors: None`,
                        ].join("\n"),
                        embeds: [embed],
                        components: [buttons],
                        // files: attachment ? [attachment] : [], // Comentado temporalmente
                    });
                    configuration.messageid = message.id; // Save the new message ID
                }
                else {
                    // Edit the existing message
                    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
                    await message.edit({
                        content: [
                            `Status updated by: ${main_1.client.user?.tag}`,
                            `Time since last update: ${elapsedTime} seconds`,
                            `API Response Time: ${apiResponseTime}ms`,
                            `Errors: None`,
                        ].join("\n"),
                        embeds: [embed],
                        components: [buttons],
                        // files: attachment ? [attachment] : [], // Comentado temporalmente
                    });
                }
            }
            catch (error) {
                (0, console_1.logWithLabel)("error", `Error updating the status: ${error.message}`, "Status Handler");
                console.error(error);
            }
        };
        // Schedule the first update after 1 minute
        setTimeout(() => {
            updateStatus();
            // Schedule subsequent updates every 5 minutes
            setInterval(updateStatus, 5 * 60 * 1000);
        }, 60 * 1000);
    }
    // Check if the status handler is enabled and call the main function
    if (configuration.enabled) {
        Main().catch((error) => {
            (0, console_1.logWithLabel)("error", `Error initializing status handler: ${error}`);
        });
    }
    else {
        (0, console_1.logWithLabel)("custom", "Status handler is disabled.", "Status");
    }
});
