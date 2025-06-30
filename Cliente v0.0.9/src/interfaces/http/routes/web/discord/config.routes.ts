import { Request, Response } from "express";

import { main } from "@/main";
import { TRoutesInput } from "@/typings/utils";

const formatRoute = (path: string): string => `/dashboard/utils/discord/${path}`;
export default ({ app }: TRoutesInput) => {
  /**
   * Get all Discord configs.
   * @route GET /dashboard/utils/discord
   */
  app.get(formatRoute("config"), async (_req: Request, res: Response) => {
    try {
      const discordConfigs = await main.prisma.discord.findMany();
      console.debug("[Discord][GET] All Discord configs fetched:", discordConfigs.length);
      return res.status(200).json({ success: true, data: discordConfigs });
    } catch (error: any) {
      console.error("[Discord][GET] Error fetching Discord configs:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch Discord configs", error: error.message });
    }
  });

  /**
   * Get a Discord config by ID.
   * @route GET /dashboard/utils/discord/:id
   */
  app.get(formatRoute("config/:id"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const discordData = await main.prisma.discord.findUnique({ where: { id } });
      if (!discordData) {
        console.debug(`[Discord][GET] Discord config not found: ${id}`);
        return res.status(404).json({ success: false, message: "Discord config not found" });
      }
      console.debug(`[Discord][GET] Discord config fetched: ${id}`);
      return res.status(200).json({ success: true, data: discordData });
    } catch (error: any) {
      console.error("[Discord][GET] Error fetching Discord config:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch Discord config", error: error.message });
    }
  });

  /**
   * Create a new Discord config.
   * @route POST /dashboard/utils/discord
   */
  app.post(formatRoute("config"), async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const created = await main.prisma.discord.create({ data });
      console.debug("[Discord][POST] Discord config created:", created.id);
      return res.status(201).json({ success: true, message: "Discord config created successfully", data: created });
    } catch (error: any) {
      console.error("[Discord][POST] Error creating Discord config:", error);
      return res.status(500).json({ success: false, message: "Failed to create Discord config", error: error.message });
    }
  });

  /**
   * Update a Discord config by ID.
   * @route PUT /dashboard/utils/discord/:id
   */
  app.put(formatRoute("config/:id"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await main.prisma.discord.update({ where: { id }, data });
      console.debug(`[Discord][PUT] Discord config updated: ${id}`);
      return res.status(200).json({ success: true, message: "Discord config updated successfully", data: updated });
    } catch (error: any) {
      console.error("[Discord][PUT] Error updating Discord config:", error);
      return res.status(500).json({ success: false, message: "Failed to update Discord config", error: error.message });
    }
  });

  /**
   * Delete a Discord config by ID.
   * @route DELETE /dashboard/utils/discord/:id
   */
  app.delete(formatRoute("config/:id"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await main.prisma.discord.delete({ where: { id } });
      console.debug(`[Discord][DELETE] Discord config deleted: ${id}`);
      return res.status(200).json({ success: true, message: "Discord config deleted successfully" });
    } catch (error: any) {
      console.error("[Discord][DELETE] Error deleting Discord config:", error);
      return res.status(500).json({ success: false, message: "Failed to delete Discord config", error: error.message });
    }
  });

  /**
   * Enable or disable a CommandCategory by ID.
   * @route PATCH /dashboard/utils/discord/category/:id/enable
   * @body { enabled: boolean }
   */
  app.patch(
    formatRoute("category/:id/enable"),
    async (req: Request<{ id: string }, any, { enabled: boolean }>, res: Response) => {
      try {
        const { id } = req.params;
        const { enabled } = req.body;

        if (typeof enabled !== "boolean") {
          return res.status(400).json({ success: false, message: "The 'enabled' field must be a boolean." });
        }

        const category = await main.prisma.commandCategory.findUnique({ where: { id } });
        if (!category) {
          return res.status(404).json({ success: false, message: "Command category not found." });
        }

        const updated = await main.prisma.commandCategory.update({
          where: { id },
          data: { enabled },
        });

        return res.status(200).json({
          success: true,
          message: `Command category has been ${enabled ? "enabled" : "disabled"} successfully.`,
          data: updated,
        });
      } catch (error: any) {
        console.error("[CommandCategory][PATCH] Error updating category status:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to update command category status.",
          error: error?.message || "Unknown error",
        });
      }
    },
  );
};
