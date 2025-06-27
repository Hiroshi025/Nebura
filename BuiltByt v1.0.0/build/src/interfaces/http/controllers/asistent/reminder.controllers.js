"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="363820a4-4b8d-5825-bbb0-7e9924cfefbc")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderController = void 0;
const reminder_service_1 = require("../../../../application/services/utilities/reminder.service");
/**
 * Controller for handling reminder-related HTTP requests.
 *
 * Provides endpoints to fetch upcoming reminders using the ReminderService.
 *
 * @example
 * // Usage with Express:
 * app.get('/api/reminders/upcoming', reminderController.getUpcomingReminders);
 */
class ReminderController extends reminder_service_1.ReminderService {
    constructor() {
        super();
    }
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
    async getUpReminders(req, res) {
        try {
            const reminders = await this.getUpcomingReminders();
            res.json(reminders);
        }
        catch (error) {
            res.status(500).json({ message: req.t("errors:failed_to_fetch_reminders") });
        }
    }
}
exports.ReminderController = ReminderController;
//# sourceMappingURL=reminder.controllers.js.map
//# debugId=363820a4-4b8d-5825-bbb0-7e9924cfefbc
