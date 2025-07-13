import { LavalinkManager, PlayerJson } from "lavalink-client";

import { main } from "@/main";

import { PrismaQueueStore } from "./prismaStore";

/**
 * PlayerSaver is responsible for persisting and retrieving Lavalink player data
 * to and from the database. It extends PrismaQueueStore to utilize database operations.
 *
 * This class listens to player updates and saves the latest state, as well as
 * provides methods to fetch or delete player data for a specific guild.
 */
export class PlayerSaver extends PrismaQueueStore {
  /**
   * Constructs a new PlayerSaver instance.
   */
  constructor() {
    super();
  }

  /**
   * Listens to the 'playerUpdate' event from the LavalinkManager and saves
   * the updated player data to the database if relevant properties have changed.
   *
   * @param lavalink - The LavalinkManager instance to listen for player updates.
   */
  listenToEvents(lavalink: LavalinkManager) {
    lavalink.on("playerUpdate", (oldPlayer, newPlayer) => {
      const newPlayerData = newPlayer.toJSON();
      if (
        !oldPlayer ||
        oldPlayer.voiceChannelId !== newPlayerData.voiceChannelId ||
        oldPlayer.textChannelId !== newPlayerData.textChannelId ||
        oldPlayer.options.selfDeaf !== newPlayerData.options.selfDeaf ||
        oldPlayer.options.selfMute !== newPlayerData.options.selfMute ||
        oldPlayer.nodeId !== newPlayerData.nodeId ||
        oldPlayer.nodeSessionId !== newPlayerData.nodeSessionId ||
        oldPlayer.options.applyVolumeAsFilter !== newPlayerData.options.applyVolumeAsFilter ||
        oldPlayer.options.instaUpdateFiltersFix !== newPlayerData.options.instaUpdateFiltersFix ||
        oldPlayer.options.vcRegion !== newPlayerData.options.vcRegion
      ) {
        this.set(newPlayer.guildId, JSON.stringify(newPlayerData));
      }
    });
  }

  /**
   * Retrieves all stored nodeSessionId and nodeId pairs from the database.
   *
   * @returns A Promise that resolves to a Map where the key is nodeId and the value is nodeSessionId.
   */
  async getAllLastNodeSessions(): Promise<Map<string, string>> {
    try {
      const all = await await main.prisma.queueData.findMany();
      const sessionIds = new Map<string, string>();
      for (const entry of all) {
        const json = JSON.parse(entry.data);
        if (json.nodeSessionId && json.nodeId) sessionIds.set(json.nodeId, json.nodeSessionId);
      }
      return sessionIds;
    } catch {
      return new Map();
    }
  }

  /**
   * Retrieves the player data for a specific guild from the database.
   *
   * @param guildId - The ID of the guild whose player data should be fetched.
   * @returns A Promise that resolves to the PlayerJson object or null if not found.
   */
  async getPlayer(guildId: string): Promise<PlayerJson | null> {
    const data = await this.get(guildId);
    return data ? (JSON.parse(data) as PlayerJson) : null;
  }

  /**
   * Deletes the player data for a specific guild from the database.
   *
   * @param guildId - The ID of the guild whose player data should be deleted.
   * @returns A Promise that resolves when the operation is complete.
   */
  async delPlayer(guildId: string): Promise<void> {
    await this.delete(guildId);
  }
}
