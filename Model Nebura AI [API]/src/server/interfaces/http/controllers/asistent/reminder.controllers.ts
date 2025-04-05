import { Request, Response } from "express";

import { ReminderService } from "@/server/domain/services/utilities/reminder.service";

const reminderService = new ReminderService();

export class ReminderController {
  async getUpcomingReminders(_req: Request, res: Response) {
    try {
      const reminders = await reminderService.getUpcomingReminders();
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching reminders' });
    }
  }
}