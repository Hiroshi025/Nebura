import { Request, Response } from "express";

import { UserChangeRole } from "@/server/domain/services/user.services";
import {
  isErrorResponse,
  normalizeError,
  sendErrorResponse,
  sendSuccessResponse,
} from "@/server/shared/helper-method";

export class UserController {
  static async changeRole(req: Request, res: Response) {
    try {
      const { id, role } = req.body;

      if (!id || !role) {
        return sendErrorResponse(res, 400, ["Missing user ID or role"]);
      }

      const response = await UserChangeRole(id, role);

      if (isErrorResponse(response)) {
        return sendErrorResponse(res, 400, normalizeError(response));
      }

      return sendSuccessResponse(res, 200, {
        message: "User role updated successfully",
        data: response,
      });
    } catch (error) {
      console.error("[UserController] Change role error:", error);
      return sendErrorResponse(res, 500, ["Internal server error"]);
    }
  }
}
