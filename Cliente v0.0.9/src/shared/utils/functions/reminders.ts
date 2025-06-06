import { scheduleJob } from "node-schedule";

import { client, main } from "@/main";
import { EmbedCorrect } from "@extenders/discord/embeds.extend";

/**
 * Loads pending reminders from the database and schedules them.
 *
 * This function retrieves reminders that have not been sent and are scheduled for a future time.
 * It uses the `node-schedule` library to schedule the reminders and sends them to the respective users.
 */
export async function loadPendingReminders(): Promise<void> {
  const pendingReminders = await main.prisma.reminder.findMany({
    where: {
      isSent: false,
      remindAt: { gte: new Date() },
    },
  });

  for (const reminder of pendingReminders) {
    scheduleJob(new Date(reminder.remindAt), async () => {
      const member = await client.guilds.cache
        .get(reminder.guildId)
        ?.members.fetch(reminder.userId);

      if (member) {
        await member
          .send({
            embeds: [new EmbedCorrect().setTitle(`Reminder!`).setDescription(reminder.message)],
          })
          .catch(() => {});

        await main.prisma.reminder.update({
          where: { id: reminder.id },
          data: { isSent: true },
        });
      }
    });
  }
}
