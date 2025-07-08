import { Request, Response } from "express";

// Importa los tipos necesarios de Express
import { main } from "@/main";
import { TRoutesInput } from "@/typings/utils";

const formatRoute = (path: string): string => `/dashboard/utils/whatsapp/${path}`;
export default ({ app }: TRoutesInput) => {
  /**
   * Get all WhatsApp configs.
   * @route GET /dashboard/utils/whatsapp
   */
  app.get(formatRoute(""), async (_req: Request, res: Response) => {
    try {
      const whatsappConfigs = await main.prisma.whatsApp.findMany();
      console.debug("[WhatsApp][GET] All WhatsApp configs fetched:", whatsappConfigs.length);
      return res.status(200).json({ success: true, data: whatsappConfigs });
    } catch (error: any) {
      console.error("[WhatsApp][GET] Error fetching WhatsApp configs:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch WhatsApp configs",
        error: error.message,
      });
    }
  });

  /**
   * Get a WhatsApp config by ID.
   * @route GET /dashboard/utils/whatsapp/:id
   */
  app.get(formatRoute(":id"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const whatsappData = await main.prisma.whatsApp.findUnique({ where: { id } });
      if (!whatsappData) {
        console.debug(`[WhatsApp][GET] WhatsApp config not found: ${id}`);
        return res.status(404).json({ success: false, message: "WhatsApp config not found" });
      }
      console.debug(`[WhatsApp][GET] WhatsApp config fetched: ${id}`);
      return res.status(200).json({ success: true, data: whatsappData });
    } catch (error: any) {
      console.error("[WhatsApp][GET] Error fetching WhatsApp config:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch WhatsApp config", error: error.message });
    }
  });

  /**
   * Create a new WhatsApp config.
   * @route POST /dashboard/utils/whatsapp
   */
  app.post(formatRoute(""), async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const created = await main.prisma.whatsApp.create({ data });
      console.debug("[WhatsApp][POST] WhatsApp config created:", created.id);
      return res.status(201).json({ success: true, message: "WhatsApp config created successfully", data: created });
    } catch (error: any) {
      console.error("[WhatsApp][POST] Error creating WhatsApp config:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create WhatsApp config",
        error: error.message,
      });
    }
  });

  /**
   * Update a WhatsApp config by ID.
   * @route PUT /dashboard/utils/whatsapp/:id
   */
  app.put(formatRoute(":id"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await main.prisma.whatsApp.update({ where: { id }, data });
      console.debug(`[WhatsApp][PUT] WhatsApp config updated: ${id}`);
      return res.status(200).json({ success: true, message: "WhatsApp config updated successfully", data: updated });
    } catch (error: any) {
      console.error("[WhatsApp][PUT] Error updating WhatsApp config:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update WhatsApp config",
        error: error.message,
      });
    }
  });

  /**
   * Delete a WhatsApp config by ID.
   * @route DELETE /dashboard/utils/whatsapp/:id
   */
  app.delete(formatRoute(":id"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await main.prisma.whatsApp.delete({ where: { id } });
      console.debug(`[WhatsApp][DELETE] WhatsApp config deleted: ${id}`);
      return res.status(200).json({ success: true, message: "WhatsApp config deleted successfully" });
    } catch (error: any) {
      console.error("[WhatsApp][DELETE] Error deleting WhatsApp config:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete WhatsApp config",
        error: error.message,
      });
    }
  });
};
