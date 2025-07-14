import { Request, Response } from "express";

// Importa los tipos necesarios de Express
import { client, main } from "@/main";
import { TRoutesInput } from "@/typings/utils";

/**
 * Tipos para el body y la actividad de Discord
 */
type DiscordActivity = {
  status: string;
  name: string;
  url: string;
  [key: string]: any;
};

type DiscordBody = {
  username?: string;
  avatar?: string;
  activity?: DiscordActivity;
};

const formatRoute = (path: string): string => `/dashboard/utils/clients/${path}`;
export default ({ app }: TRoutesInput) => {
  console.debug("[apps.routes] Initializing routes for utils-clients");

  // ===================== DISCORD =====================

  // Editar Discord config (solo username, avatar, activity)
  app.put(formatRoute(":id/discord"), async (req: Request<{ id: string }, any, DiscordBody>, res: Response) => {
    console.debug("[apps.routes] PUT /discord/:id called", { params: req.params, body: req.body });
    try {
      const { id } = req.params;
      const { username, avatar, activity } = req.body;

      if (!id || typeof id !== "string") {
        console.debug("[apps.routes] Invalid or missing id param", { id });
        return res.status(400).json({ success: false, message: "ID de cliente inválido o faltante" });
      }

      if (!activity || typeof activity !== "object") {
        console.debug("[apps.routes] Activity missing or not an object", { activity });
        return res.status(400).json({
          success: false,
          message: "Actividad debe ser un objeto válido",
        });
      }

      const { status, name, url } = activity;
      if (!status || !name || !url) {
        console.debug("[apps.routes] Activity missing required fields", { activity });
        return res.status(400).json({
          success: false,
          message: "Actividad debe contener status, name y url",
        });
      }

      console.debug("[apps.routes] Searching discord config by clientId", id);
      const discord = await main.prisma.discord.findFirst({ where: { clientId: id } });
      if (!discord) {
        console.debug("[apps.routes] Discord config not found", { clientId: id });
        return res.status(404).json({ success: false, message: "Discord config no encontrada" });
      }

      if (!discord.activity || typeof discord.activity !== "object") {
        console.debug("[apps.routes] Discord config missing activity", { discord });
        return res.status(404).json({ success: false, message: "Discord config sin actividad" });
      }

      console.debug("[apps.routes] Updating discord config in DB", {
        id: discord.id,
        username,
        avatar,
        activity,
      });

      const updated = await main.prisma.discord.update({
        where: { id: discord.id },
        data: {
          username: username ?? discord.username,
          avatar: avatar ?? discord.avatar,
          activity: activity ?? discord.activity,
        },
      });

      if (updated && client.user) {
        try {
          console.debug("[apps.routes] Updating Discord bot user", { username, avatar, activity });
          await client.user.setUsername(username ?? discord.username);
          await client.user.setAvatar(avatar ?? discord.avatar);
          await client.user.setActivity({
            state: activity.status,
            name: activity.name,
            url: activity.url,
          });
        } catch (botError: any) {
          console.error("[apps.routes] Error updating Discord bot user", { botError });
          // No se retorna error, solo se loguea
        }
      }

      console.debug("[apps.routes] Discord config updated successfully", { updated });
      return res.status(200).json({ success: true, message: "Discord config actualizada", data: updated });
    } catch (error: any) {
      console.error("[apps.routes] Error updating Discord config", { error: error?.stack || error });
      return res.status(500).json({
        success: false,
        message: "Error al actualizar Discord config",
        error: error?.message || "Error desconocido",
      });
    }
  });

  // Eliminar Discord config (solo username, avatar, activity)
  app.delete(formatRoute(":id/discord"), async (req: Request<{ id: string }>, res: Response) => {
    console.debug("[apps.routes] DELETE /discord/:id called", { params: req.params });
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        console.debug("[apps.routes] Invalid or missing id param", { id });
        return res.status(400).json({ success: false, message: "ID de discord inválido o faltante" });
      }
      console.debug("[apps.routes] Searching discord config by id", id);
      const discord = await main.prisma.discord.findUnique({ where: { id } });
      if (!discord) {
        console.debug("[apps.routes] Discord config not found for delete", { id });
        return res.status(404).json({ success: false, message: "Discord config no encontrada" });
      }
      console.debug("[apps.routes] Deleting discord config", { id });
      await main.prisma.discord.delete({ where: { id } });
      console.debug("[apps.routes] Discord config deleted", { id });
      return res.status(200).json({ success: true, message: "Discord config eliminada" });
    } catch (error: any) {
      console.error("[apps.routes] Error deleting Discord config", { error: error?.stack || error });
      return res.status(500).json({
        success: false,
        message: "Error al eliminar Discord config",
        error: error?.message || "Error desconocido",
      });
    }
  });

  app.get(formatRoute(":id/discord"), async (req: Request<{ id: string }>, res: Response) => {
    console.debug("[apps.routes] GET /discord/:id called", { params: req.params });
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        console.debug("[apps.routes] Invalid or missing id param", { id });
        return res.status(400).json({ success: false, message: "ID de cliente inválido o faltante" });
      }
      console.debug("[apps.routes] Searching discord config by clientId", id);
      const discord = await main.prisma.discord.findFirst({ where: { clientId: id } });
      if (!discord) {
        console.debug("[apps.routes] Discord config not found for get", { id });
        return res.status(404).json({ success: false, message: "Discord config no encontrada" });
      }
      console.debug("[apps.routes] Discord config found", { discord });
      return res.status(200).json({ success: true, data: discord });
    } catch (error: any) {
      console.error("[apps.routes] Error getting Discord config", { error: error?.stack || error });
      return res.status(500).json({
        success: false,
        message: "Error al obtener Discord config",
        error: error?.message || "Error desconocido",
      });
    }
  });
};
