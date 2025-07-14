import { Request, Response } from "express";
import { statSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { extname, join } from "path";

import { TRoutesInput } from "@/typings/utils";

/**
 * Formats the route path for NSFW images endpoints.
 *
 * @param path - The path to append to the base NSFW images route.
 * @returns The formatted route string.
 *
 * @example
 * ```ts
 * const route = formatRoute("example.jpg"); // "/dashboard/utils/nsfw-images/example.jpg"
 * ```
 */
const formatRoute = (path: string): string => `/dashboard/utils/nsfw-images/${path}`;

/**
 * Registers NSFW image routes for the Express application.
 *
 * @remarks
 * This route handler provides endpoints to list and serve NSFW images and videos
 * from the server's filesystem. It supports both image and video formats.
 *
 * - `GET /dashboard/utils/nsfw-images/` returns a JSON array of available media files.
 * - `GET /dashboard/utils/nsfw-images/:imageName` serves the requested media file.
 *
 * @param param0 - An object containing the Express application instance.
 *
 * @see {@link https://expressjs.com/en/4x/api.html#app.get Express app.get}
 */
export default ({ app }: TRoutesInput) => {
  /**
   * GET /dashboard/utils/nsfw-images/
   *
   * Returns a JSON array with metadata for all NSFW images and videos found in the configured directory.
   *
   * Each object in the array contains:
   * - `id`: Unique identifier (filename)
   * - `url`: Public URL to access the file
   * - `path`: Absolute path on the server
   * - `name`: Human-readable name (filename without extension, underscores replaced)
   * - `size`: File size in KB
   * - `date`: Last modification date (ISO string)
   * - `type`: "image" or "video"
   * - `category`: Category (default: "general")
   * - `tags`: Array of tags (default: empty)
   * - `views`: View counter (default: 0)
   *
   * @see {@link https://nodejs.org/api/fs.html#fspromisesreaddirpath-options fs.promises.readdir}
   */
  app.get(formatRoute(""), async (_req: Request, res: Response) => {
    try {
      const dirPath = join(__dirname, "../../../../../../config/logs-apps/nsfw-image");
      const files = await readdir(dirPath);

      // Supported media extensions (including video formats)
      const mediaExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];
      const images = await Promise.all(
        files
          .filter((file) => mediaExtensions.some((ext) => file.toLowerCase().endsWith(ext)))
          .map(async (file) => {
            const filePath = join(dirPath, file);
            const stats = statSync(filePath);

            // Extract name without extension for display
            const nameWithoutExt = file.replace(/\.[^/.]+$/, "");

            // Determine if the file is a video
            const isVideo = [".mp4", ".webm"].some((ext) => file.toLowerCase().endsWith(ext));

            return {
              id: file, // Use filename as unique ID
              url: `/dashboard/utils/nsfw-images/${file}`,
              path: filePath,
              name: nameWithoutExt.replace(/_/g, " "), // More readable name
              size: Math.round(stats.size / 1024), // Size in KB
              date: stats.mtime.toISOString(), // Last modification date
              type: isVideo ? "video" : "image",
              category: "general", // You can categorize based on subfolders or naming
              tags: [], // Tags can be extracted from filename if needed
              views: 0, // View counter (not implemented)
            };
          }),
      );

      res.json(images);
    } catch (err) {
      console.error("Error reading NSFW images:", err);
      res.status(500).json({ error: "Error reading NSFW images." });
    }
  });

  /**
   * Mapping of file extensions to MIME types for serving media files.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types Common MIME types}
   */
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };

  /**
   * GET /dashboard/utils/nsfw-images/:imageName
   *
   * Serves the requested NSFW image or video file.
   *
   * @param req - Express request object, expects `imageName` parameter.
   * @param res - Express response object.
   *
   * @see {@link https://nodejs.org/api/fs.html#fspromisesreadfilepath-options fs.promises.readFile}
   */
  app.get(formatRoute(":imageName"), async (req: Request, res: Response) => {
    const { imageName } = req.params;
    const dirPath = join(__dirname, "../../../../../../config/logs-apps/nsfw-image");
    const filePath = join(dirPath, imageName);

    try {
      // Detect the file extension and set the appropriate Content-Type
      const ext = extname(imageName).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";

      const file = await readFile(filePath);
      res.set("Content-Type", contentType);
      res.send(file);
    } catch (err) {
      console.error("Error serving NSFW image:", err);
      res.status(404).json({ error: "Image not found." });
    }
  });
};
