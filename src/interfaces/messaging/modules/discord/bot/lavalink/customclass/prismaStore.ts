import { main } from "@/main";

/**
 * PrismaQueueStore provides basic CRUD operations for queue data
 * associated with Discord guilds, using Prisma as the ORM.
 *
 * This class is intended to be extended by other classes that require
 * persistent storage of queue or player data.
 */
export class PrismaQueueStore {
  /**
   * Constructs a new PrismaQueueStore instance.
   */
  constructor() {}

  /**
   * Retrieves the stored queue data for a specific guild.
   *
   * @param guildId - The ID of the guild whose data should be fetched.
   * @returns A Promise that resolves to the stringified queue data, or null if not found.
   */
  async get(guildId: string): Promise<string | null> {
    const entry = await main.prisma.queueData.findUnique({ where: { guildId } });
    return entry?.data ?? null;
  }

  /**
   * Stores or updates the queue data for a specific guild.
   *
   * @param guildId - The ID of the guild whose data should be stored.
   * @param stringifiedQueueData - The queue data as a JSON string.
   * @returns A Promise that resolves when the operation is complete.
   */
  async set(guildId: string, stringifiedQueueData: string): Promise<void> {
    await main.prisma.queueData.upsert({
      where: { guildId },
      update: { data: stringifiedQueueData },
      create: { guildId, data: stringifiedQueueData },
    });
  }

  /**
   * Deletes the queue data for a specific guild.
   *
   * @param guildId - The ID of the guild whose data should be deleted.
   * @returns A Promise that resolves when the operation is complete.
   */
  async delete(guildId: string): Promise<void> {
    await main.prisma.queueData.delete({ where: { guildId } }).catch(() => {});
  }
}
