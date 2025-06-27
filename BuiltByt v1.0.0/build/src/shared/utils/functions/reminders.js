"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="92ba5c29-066e-5c1d-b6b5-7b3897dd1843")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPendingReminders = loadPendingReminders;
const node_schedule_1 = require("node-schedule");
const main_1 = require("../../../main");
const embeds_extend_1 = require("../../../shared/adapters/extends/embeds.extend");
/**
 * Loads pending reminders from the database and schedules them.
 *
 * This function retrieves reminders that have not been sent and are scheduled for a future time.
 * It uses the `node-schedule` library to schedule the reminders and sends them to the respective users.
 */
async function loadPendingReminders() {
    const pendingReminders = await main_1.main.prisma.reminder.findMany({
        where: {
            isSent: false,
            remindAt: { gte: new Date() },
        },
    });
    for (const reminder of pendingReminders) {
        (0, node_schedule_1.scheduleJob)(new Date(reminder.remindAt), async () => {
            const member = await main_1.client.guilds.cache.get(reminder.guildId)?.members.fetch(reminder.userId);
            if (member) {
                await member
                    .send({
                    embeds: [new embeds_extend_1.EmbedCorrect().setTitle(`Reminder!`).setDescription(reminder.message)],
                })
                    .catch(() => { });
                await main_1.main.prisma.reminder.update({
                    where: { id: reminder.id },
                    data: { isSent: true },
                });
            }
        });
    }
}
//# sourceMappingURL=reminders.js.map
//# debugId=92ba5c29-066e-5c1d-b6b5-7b3897dd1843
