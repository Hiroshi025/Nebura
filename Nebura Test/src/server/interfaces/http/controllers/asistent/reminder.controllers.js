"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderController = void 0;
const reminder_service_1 = require("../../../../../server/domain/services/utilities/reminder.service");
const reminderService = new reminder_service_1.ReminderService();
class ReminderController {
    async getUpcomingReminders(req, res) {
        try {
            const reminders = await reminderService.getUpcomingReminders();
            res.json(reminders);
        }
        catch (error) {
            res.status(500).json({ message: req.t("errors:failed_to_fetch_reminders") });
        }
    }
}
exports.ReminderController = ReminderController;
