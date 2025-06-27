"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="0b1c8629-bb0e-5429-b3bd-0a68aafad959")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const addons_1 = require("../../../../../../interfaces/messaging/modules/discord/structure/addons");
const main_1 = require("../../../../../../main");
const config_1 = __importDefault(require("./config"));
/**
 * NSFW Image Addon for Discord.
 *
 * This addon periodically fetches a random NSFW image from the waifu.pics API,
 * saves it to a local directory, and optionally sends it to configured NSFW channels.
 *
 * @see https://waifu.pics/
 * @author Hiroshi025
 * @version 2.0.0
 */
exports.default = new addons_1.Addons({
    name: "Nsfw Image Addon",
    description: "Addon for sending NSFW images in Discord channels.",
    author: "Hiroshi025",
    version: "2.0.0",
    bitfield: ["SendMessages"],
}, async () => {
    setInterval(async () => {
        try {
            // Primera parte: Guardado de imágenes (siempre activa)
            await sendNSFWToChannels();
            // Segunda parte: Envío a canales (depende de config.enabled)
            if (config_1.default.enabled) {
                await saveRandomNSFWImage();
            }
        }
        catch (error) {
            console.error("Error en el addon NSFW:", error);
        }
    }, config_1.default.time);
});
/**
 * Saves a random NSFW image to the local directory.
 * This operation is independent of the config.enabled setting.
 */
async function saveRandomNSFWImage() {
    const random = ["waifu", "neko", "blowjob"];
    const url = config_1.default.url;
    const imageType = random[Math.floor(Math.random() * random.length)];
    const image = `${url}${imageType}`;
    // Fetch image metadata
    const res = await fetch(image);
    if (!res.ok)
        throw new Error(`Error fetching image: ${res.statusText}`);
    const data = await res.json();
    // Ensure directory exists
    fs_1.default.mkdirSync(config_1.default.path, { recursive: true });
    // Determine next file number
    const files = fs_1.default.readdirSync(config_1.default.path);
    const fileNumber = files.length;
    const filePath = `${config_1.default.path}/nsfw-image-${fileNumber}.jpg`;
    // Download and save image
    const response = await fetch(data.url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs_1.default.writeFileSync(filePath, buffer);
}
/**
 * Sends NSFW images to configured Discord channels.
 * Only sends if config.enabled is true.
 */
async function sendNSFWToChannels() {
    const guilds = await main_1.main.prisma.myGuild.findMany({
        select: { nsfwChannel: true },
    });
    for (const guild of guilds) {
        if (!guild.nsfwChannel && guild.nsfwChannel === null)
            return;
        const random = ["waifu", "neko", "blowjob"];
        const url = config_1.default.url;
        const imageType = random[Math.floor(Math.random() * random.length)];
        const image = `${url}${imageType}`;
        // Fetch image metadata
        const res = await fetch(image);
        if (!res.ok)
            throw new Error(`Error fetching image: ${res.statusText}`);
        const data = await res.json();
        const response = await fetch(data.url);
        if (!response.ok)
            throw new Error(`Error downloading image: ${response.statusText}`);
        const channel = await main_1.client.channels.cache.get(guild.nsfwChannel);
        if (channel?.type === discord_js_1.ChannelType.GuildText) {
            await channel.send({ content: data.url });
        }
    }
}
//# sourceMappingURL=nsfw.addon.js.map
//# debugId=0b1c8629-bb0e-5429-b3bd-0a68aafad959
