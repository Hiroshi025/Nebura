import { Request, Response } from "express";
import { statSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { extname, join } from "path";

import { TRoutesInput } from "@/typings/utils";

const formatRoute = (path: string): string => `/dashboard/utils/nsfw-images/${path}`;
export default ({ app }: TRoutesInput) => {
  app.get(formatRoute(""), async (_req: Request, res: Response) => {
    try {
      const dirPath = join(__dirname, "../../../../../../config/logs-apps/nsfw-images");
      const files = await readdir(dirPath);

      // Extensiones soportadas (añadí formatos de video)
      const mediaExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];
      const images = await Promise.all(
        files
          .filter((file) => mediaExtensions.some((ext) => file.toLowerCase().endsWith(ext)))
          .map(async (file) => {
            const filePath = join(dirPath, file);
            const stats = statSync(filePath);

            // Extraer nombre sin extensión para el título
            const nameWithoutExt = file.replace(/\.[^/.]+$/, "");

            // Determinar el tipo de medio
            const isVideo = [".mp4", ".webm"].some((ext) => file.toLowerCase().endsWith(ext));

            return {
              id: file, // Usamos el nombre como ID único
              url: `/dashboard/utils/nsfw-images/${file}`,
              path: filePath,
              name: nameWithoutExt.replace(/_/g, " "), // Formatear nombre más legible
              size: Math.round(stats.size / 1024), // tamaño en KB
              date: stats.mtime.toISOString(), // Fecha de modificación
              type: isVideo ? "video" : "image",
              category: "general", // Puedes categorizar basado en subcarpetas o nombres
              tags: [], // Puedes extraer tags del nombre del archivo
              views: 0, // Contador de vistas (podrías implementarlo)
            };
          }),
      );

      res.json(images);
    } catch (err) {
      console.error("Error al leer las imágenes:", err);
      res.status(500).json({ error: "Error al leer las imágenes." });
    }
  });

  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };

  app.get(formatRoute(":imageName"), async (req: Request, res: Response) => {
    const { imageName } = req.params;
    const dirPath = join(__dirname, "../../../../../../config/logs-apps/nsfw-image");
    const filePath = join(dirPath, imageName);

    try {
      // Detecta la extensión real
      const ext = extname(imageName).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";

      const file = await readFile(filePath);
      res.set("Content-Type", contentType);
      res.send(file);
    } catch (err) {
      console.error("Error al servir la imagen:", err);
      res.status(404).json({ error: "Imagen no encontrada." });
    }
  });
};
