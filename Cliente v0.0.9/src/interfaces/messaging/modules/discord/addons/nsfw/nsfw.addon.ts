import fs from "fs";

import { Addons } from "@/interfaces/messaging/modules/discord/structure/addons";

import config from "./config";

/**
 * NSFW Image Addon for Discord.
 *
 * This addon periodically fetches a random NSFW image from the waifu.pics API,
 * saves it to a local directory, and logs the file path. It is intended for use
 * in Discord channels that allow NSFW content.
 *
 * The addon uses a setInterval to fetch and store a new image every 2 minutes (120,000 ms).
 * Images are saved with incremental filenames in the 'config/logs-apps/nsfw-image' directory.
 *
 * @see https://waifu.pics/
 * @author Hiroshi025
 * @version 1.0.0
 */
export default new Addons(
  {
    /**
     * Addon metadata.
     * @property name - The name of the addon.
     * @property description - A brief description of the addon's purpose.
     * @property author - The author of the addon.
     * @property version - The version of the addon.
     * @property bitfield - Required Discord permissions for the addon.
     */
    name: "Nsfw Image Addon",
    description: "Addon for sending NSFW images in Discord channels.",
    author: "Hiroshi025",
    version: "1.0.0",
    bitfield: ["SendMessages"],
  },
  /**
   * Main execution function for the addon.
   *
   * Sets up a periodic task that:
   * - Selects a random NSFW image type ('waifu', 'neko', or 'blowjob').
   * - Fetches the image metadata from the waifu.pics API.
   * - Downloads the image and saves it locally with an incremental filename.
   * - Logs the saved file path to the console.
   *
   * Errors during fetching or saving are caught and logged.
   */
  async () => {
    setInterval(async () => {
      try {
        // List of available NSFW image types
        if (config.enabled === false) return;
        const random = ["waifu", "neko", "blowjob"] as const;
        const url = config.url;
        // Select a random image type
        const imageType = random[Math.floor(Math.random() * random.length)];
        const image = `${url}${imageType}`;

        // Fetch image metadata from the API
        const res = await fetch(image);
        if (!res.ok) {
          throw new Error(`Error fetching image: ${res.statusText}`);
        }

        const data = await res.json();
        // Ensure the target directory exists
        fs.mkdirSync(config.path, { recursive: true });

        // Determine the next file number based on existing files
        const files = fs.readdirSync(config.path);
        const fileNumber = files.length;
        const filePath = `${config.path}/nsfw-image-${fileNumber}.jpg`;

        // Download the image and save it as a buffer
        const response = await fetch(data.url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);

        // Log the saved file path
        console.log(`Imagen NSFW guardada en: ${filePath}`);
      } catch (error) {
        // Log any errors encountered during the process
        console.error("Error al obtener imagen NSFW:", error);
      }
    }, config.time); // 2 minutes interval
  },
);
