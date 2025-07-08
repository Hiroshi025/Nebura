import { Request, Response } from "express";

import { main } from "@/main";
import { TRoutesInput } from "@/typings/utils";

const formatRoute = (path: string): string => `/dashboard/utils/discord/${path}`;
export default ({ app }: TRoutesInput) => {
  /**
   * Get all commands for a guild.
   * @route GET /dashboard/utils/commands/:guildId
   */
  app.get(formatRoute("commands/:guildId"), async (req: Request, res: Response) => {
    try {
      const { guildId } = req.params;
      const commands = await main.prisma.command.findMany({
        where: { guildId },
        orderBy: { createdAt: "desc" },
      });
      console.debug(`[Command][GET] Commands fetched for guild: ${guildId}`);
      return res.status(200).json({
        success: true,
        data: commands,
      });
    } catch (error: any) {
      console.error("[Command][GET] Error fetching commands:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch commands",
        error: error.message,
      });
    }
  });

  /**
   * Get a specific command by ID.
   * @route GET /dashboard/utils/commands/:guildId/:commandId
   */
  app.get(formatRoute("commands/:guildId/:commandId"), async (req: Request, res: Response) => {
    try {
      const { guildId, commandId } = req.params;
      const command = await main.prisma.command.findFirst({
        where: {
          id: commandId,
          guildId,
        },
      });

      if (!command) {
        console.debug(`[Command][GET] Command not found: ${commandId}`);
        return res.status(404).json({
          success: false,
          message: "Command not found",
        });
      }

      console.debug(`[Command][GET] Command fetched: ${commandId}`);
      return res.status(200).json({
        success: true,
        data: command,
      });
    } catch (error: any) {
      console.error("[Command][GET] Error fetching command:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch command",
        error: error.message,
      });
    }
  });

  /**
   * Create a new command.
   * @route POST /dashboard/utils/commands
   */
  app.post(formatRoute("commands"), async (req: Request, res: Response) => {
    try {
      const {
        guildId,
        name,
        embed,
        embedColor,
        embedTitle,
        embedFooter,
        embedImage,
        embedThumbnail,
        embedAuthor,
        buttons,
        file,
        description,
        response,
        fields,
      } = req.body;

      if (!guildId || !name) {
        return res.status(400).json({
          success: false,
          message: "guildId and name are required fields",
        });
      }

      // Validate buttons structure if provided
      if (buttons) {
        try {
          const parsedButtons = JSON.parse(buttons);
          if (!Array.isArray(parsedButtons)) {
            return res.status(400).json({
              success: false,
              message: "Buttons must be an array",
            });
          }

          for (const btn of parsedButtons) {
            if (!btn.label || !btn.style) {
              return res.status(400).json({
                success: false,
                message: "Each button must have label, style, and customId properties",
              });
            }
          }
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "Invalid buttons format. Must be valid JSON array",
          });
        }
      }

      if (fields) {
        try {
          const parsedFields = JSON.parse(fields);
          if (!Array.isArray(parsedFields)) {
            return res.status(400).json({
              success: false,
              message: "Buttons must be an array",
            });
          }

          for (const field of parsedFields) {
            if (!field.name || !field.value) {
              return res.status(400).json({
                success: false,
                message: "Each fields must have name, value properties",
              });
            }
          }
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "Invalid fields format. Must be valid JSON array",
          });
        }
      }

      const existingCommand = await main.prisma.command.findFirst({
        where: {
          guildId,
          name,
        },
      });

      if (existingCommand) {
        return res.status(400).json({
          success: false,
          message: "A command with this name already exists in this guild",
        });
      }

      const created = await main.prisma.command.create({
        data: {
          guildId,
          name,
          embed: embed || false,
          embedColor: embedColor || "Red",
          embedTitle: embedTitle || null,
          embedFooter: embedFooter || null,
          embedImage: embedImage || null,
          embedThumbnail: embedThumbnail || null,
          embedAuthor: embedAuthor || null,
          buttons: buttons ? JSON.parse(buttons) : null,
          file: file || null,
          description: description || null,
          fields: fields ? JSON.parse(fields) : null,
          response: response || null,
          isEnabled: true,
        },
      });

      console.debug("[Command][POST] Command created:", created.id);
      return res.status(201).json({
        success: true,
        message: "Command created successfully",
        data: created,
      });
    } catch (error: any) {
      console.error("[Command][POST] Error creating command:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create command",
        error: error.message,
      });
    }
  });

  /**
   * Update a command by ID.
   * @route PUT /dashboard/utils/commands/:commandId
   */
  app.put(formatRoute("commands/:commandId"), async (req: Request, res: Response) => {
    try {
      const { commandId } = req.params;
      const {
        name,
        embed,
        embedColor,
        embedTitle,
        embedFooter,
        embedImage,
        embedThumbnail,
        embedAuthor,
        buttons,
        fields,
        file,
        description,
        response,
        isEnabled,
      } = req.body;

      const existingCommand = await main.prisma.command.findUnique({
        where: { id: commandId },
      });

      if (!existingCommand) {
        console.debug(`[Command][PUT] Command not found: ${commandId}`);
        return res.status(404).json({
          success: false,
          message: "Command not found",
        });
      }

      // Check for name uniqueness in the same guild
      if (name && name !== existingCommand.name) {
        const nameExists = await main.prisma.command.findFirst({
          where: {
            guildId: existingCommand.guildId,
            name,
          },
        });

        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: "A command with this name already exists in this guild",
          });
        }
      }

      // Validate buttons if provided
      let parsedButtons = null;
      if (buttons !== undefined) {
        try {
          parsedButtons = buttons ? JSON.parse(buttons) : null;
          if (parsedButtons && !Array.isArray(parsedButtons)) {
            return res.status(400).json({
              success: false,
              message: "Buttons must be an array",
            });
          }

          if (parsedButtons) {
            for (const btn of parsedButtons) {
              if (!btn.label || !btn.style) {
                return res.status(400).json({
                  success: false,
                  message: "Each button must have label, style, and customId properties",
                });
              }
            }
          }
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "Invalid buttons format. Must be valid JSON array",
          });
        }
      }

      // Validate fields if provided
      let parsedFields = null;
      if (fields !== undefined) {
        try {
          parsedFields = fields ? JSON.parse(fields) : null;
          if (parsedFields && !Array.isArray(parsedFields)) {
            return res.status(400).json({
              success: false,
              message: "Fields must be an array",
            });
          }

          if (parsedFields) {
            for (const field of parsedFields) {
              if (!field.name || !field.value) {
                return res.status(400).json({
                  success: false,
                  message: "Each field must have name and value properties",
                });
              }
            }
          }
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "Invalid fields format. Must be valid JSON array",
          });
        }
      }

      const updated = await main.prisma.command.update({
        where: { id: commandId },
        data: {
          name: name || existingCommand.name,
          embed: typeof embed === "boolean" ? embed : existingCommand.embed,
          embedColor: embedColor || existingCommand.embedColor,
          embedTitle: embedTitle !== undefined ? embedTitle : existingCommand.embedTitle,
          embedFooter: embedFooter !== undefined ? embedFooter : existingCommand.embedFooter,
          embedImage: embedImage !== undefined ? embedImage : existingCommand.embedImage,
          embedThumbnail: embedThumbnail !== undefined ? embedThumbnail : existingCommand.embedThumbnail,
          embedAuthor: embedAuthor !== undefined ? embedAuthor : existingCommand.embedAuthor,
          buttons: buttons !== undefined ? parsedButtons : existingCommand.buttons,
          file: file !== undefined ? file : existingCommand.file,
          description: description !== undefined ? description : existingCommand.description,
          response: response !== undefined ? response : existingCommand.response,
          fields: fields !== undefined ? parsedFields : existingCommand.fields,
          isEnabled: typeof isEnabled === "boolean" ? isEnabled : existingCommand.isEnabled,
        },
      });

      console.debug(`[Command][PUT] Command updated: ${commandId}`);
      return res.status(200).json({
        success: true,
        message: "Command updated successfully",
        data: updated,
      });
    } catch (error: any) {
      console.error("[Command][PUT] Error updating command:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update command",
        error: error.message,
      });
    }
  });

  /**
   * Delete a command by ID.
   * @route DELETE /dashboard/utils/commands/:commandId
   */
  app.delete(formatRoute("commands/:commandId"), async (req: Request, res: Response) => {
    try {
      const { commandId } = req.params;

      const existingCommand = await main.prisma.command.findUnique({
        where: { id: commandId },
      });

      if (!existingCommand) {
        console.debug(`[Command][DELETE] Command not found: ${commandId}`);
        return res.status(404).json({
          success: false,
          message: "Command not found",
        });
      }

      await main.prisma.command.delete({
        where: { id: commandId },
      });

      console.debug(`[Command][DELETE] Command deleted: ${commandId}`);
      return res.status(200).json({
        success: true,
        message: "Command deleted successfully",
      });
    } catch (error: any) {
      console.error("[Command][DELETE] Error deleting command:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete command",
        error: error.message,
      });
    }
  });

  /**
   * Toggle command status (enable/disable).
   * @route PATCH /dashboard/utils/commands/:commandId/toggle
   */
  app.patch(formatRoute("commands/:commandId/toggle"), async (req: Request, res: Response) => {
    try {
      const { commandId } = req.params;

      const existingCommand = await main.prisma.command.findUnique({
        where: { id: commandId },
      });

      if (!existingCommand) {
        console.debug(`[Command][PATCH] Command not found: ${commandId}`);
        return res.status(404).json({
          success: false,
          message: "Command not found",
        });
      }

      const updated = await main.prisma.command.update({
        where: { id: commandId },
        data: {
          isEnabled: !existingCommand.isEnabled,
        },
      });

      console.debug(`[Command][PATCH] Command toggled: ${commandId}, new status: ${updated.isEnabled}`);
      return res.status(200).json({
        success: true,
        message: `Command ${updated.isEnabled ? "enabled" : "disabled"} successfully`,
        data: updated,
      });
    } catch (error: any) {
      console.error("[Command][PATCH] Error toggling command:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to toggle command status",
        error: error.message,
      });
    }
  });

  /**
   * Increment command usage count.
   * @route PATCH /dashboard/utils/commands/:commandId/usage
   */
  app.patch(formatRoute("commands/:commandId/usage"), async (req: Request, res: Response) => {
    try {
      const { commandId } = req.params;

      const existingCommand = await main.prisma.command.findUnique({
        where: { id: commandId },
      });

      if (!existingCommand) {
        console.debug(`[Command][PATCH] Command not found: ${commandId}`);
        return res.status(404).json({
          success: false,
          message: "Command not found",
        });
      }

      const updated = await main.prisma.command.update({
        where: { id: commandId },
        data: {
          usageCount: existingCommand.usageCount + 1,
        },
      });

      console.debug(`[Command][PATCH] Command usage incremented: ${commandId}, new count: ${updated.usageCount}`);
      return res.status(200).json({
        success: true,
        message: "Command usage incremented",
        data: updated,
      });
    } catch (error: any) {
      console.error("[Command][PATCH] Error incrementing command usage:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to increment command usage",
        error: error.message,
      });
    }
  });

  app.get(formatRoute("commands"), async (_req: Request, res: Response) => {
    try {
      const commands = await main.prisma.command.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({ success: true, data: commands });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch commands",
        error: error.message,
      });
    }
  });
};
