import { ChannelType } from "discord.js";
import fs from "fs";

import { Addons } from "@/interfaces/messaging/modules/discord/structure/addons";
import { client, main } from "@/main";

import config from "./config";

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
export default new Addons(
  {
    name: "Nsfw Image Addon",
    description: "Addon for sending NSFW images in Discord channels.",
    author: "Hiroshi025",
    version: "2.0.0",
    bitfield: ["SendMessages"],
  },
  async () => {
    setInterval(async () => {
      try {
        // Primera parte: Guardado de imágenes (siempre activa)
        await sendNSFWToChannels();
        
        // Segunda parte: Envío a canales (depende de config.enabled)
        if (config.enabled) {
          await saveRandomNSFWImage();
        }
      } catch (error) {
        console.error("Error en el addon NSFW:", error);
      }
    }, config.time);
  },
);

/**
 * Saves a random NSFW image to the local directory.
 * This operation is independent of the config.enabled setting.
 */
async function saveRandomNSFWImage(): Promise<void> {
  const random = ["waifu", "neko", "blowjob"] as const;
  const url = config.url;
  const imageType = random[Math.floor(Math.random() * random.length)];
  const image = `${url}${imageType}`;

  // Fetch image metadata
  const res = await fetch(image);
  if (!res.ok) throw new Error(`Error fetching image: ${res.statusText}`);

  const data = await res.json();
  
  // Ensure directory exists
  fs.mkdirSync(config.path, { recursive: true });

  // Determine next file number
  const files = fs.readdirSync(config.path);
  const fileNumber = files.length;
  const filePath = `${config.path}/nsfw-image-${fileNumber}.jpg`;

  // Download and save image
  const response = await fetch(data.url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);
}

/**
 * Sends NSFW images to configured Discord channels.
 * Only sends if config.enabled is true.
 */
async function sendNSFWToChannels(): Promise<void> {
  const guilds = await main.prisma.myGuild.findMany({
    select: { nsfwChannel: true },
  });

  for (const guild of guilds) {
    if (!guild.nsfwChannel && guild.nsfwChannel === null) return;
    const random = ["waifu", "neko", "blowjob"] as const;
    const url = config.url;
    const imageType = random[Math.floor(Math.random() * random.length)];
    const image = `${url}${imageType}`;

    // Fetch image metadata
    const res = await fetch(image);
    if (!res.ok) throw new Error(`Error fetching image: ${res.statusText}`);

    const data = await res.json();
    const response = await fetch(data.url);
    if (!response.ok) throw new Error(`Error downloading image: ${response.statusText}`);

    const channel = await client.channels.cache.get(guild.nsfwChannel);
    if (channel?.type === ChannelType.GuildText) {
      await channel.send({ content: data.url });
    }
  }
}