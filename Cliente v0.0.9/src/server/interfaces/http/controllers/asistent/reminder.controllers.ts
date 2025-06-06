import { Request, Response } from "express";

import { ReminderService } from "@/server/domain/services/utilities/reminder.service";

const reminderService = new ReminderService();

/**
 * Controller for handling reminder-related HTTP requests.
 *
 * Provides endpoints to fetch upcoming reminders using the ReminderService.
 *
 * @example
 * // Usage with Express:
 * app.get('/api/reminders/upcoming', reminderController.getUpcomingReminders);
 */
export class ReminderController {
  /**
   * Retrieves a list of upcoming reminders.
   *
   * Responds with a JSON array of reminders fetched from the ReminderService.
   * Handles errors by returning a localized error message.
   *
   * @param req - Express Request object, extended with translation function.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with reminders or error message.
   *
   * @example
   * // Response:
   * // [
   * //   { id: 1, title: "Meeting", time: "2024-06-01T10:00:00Z", ... },
   * //   ...
   * // ]
   */
  async getUpcomingReminders(req: Request, res: Response) {
    try {
      const reminders = await reminderService.getUpcomingReminders();
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: req.t("errors:failed_to_fetch_reminders") });
    }
  }
}
