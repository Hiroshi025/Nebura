"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPendingReminders = loadPendingReminders;
const node_schedule_1 = require("node-schedule");
const main_1 = require("../../../main");
const embeds_extender_1 = require("../../../structure/extenders/discord/embeds.extender");
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
            const member = await main_1.client.guilds.cache
                .get(reminder.guildId)
                ?.members.fetch(reminder.userId);
            if (member) {
                await member
                    .send({
                    embeds: [new embeds_extender_1.EmbedCorrect().setTitle(`Reminder!`).setDescription(reminder.message)],
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
