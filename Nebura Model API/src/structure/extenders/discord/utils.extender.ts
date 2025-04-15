import { Message } from "discord.js";

import { client } from "@/main";

export class Utils {
  constructor() {}

  public async get(guildId: string) {
    if (!guildId) return null;
    if (guildId === "0") return null;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return null;
    return guild;
  }

  public async cache() {
    const guilds = client.guilds.cache.map((guild) => {
      return {
        id: guild.id,
        name: guild.name,
        iconURL: guild.iconURL(),
        memberCount: guild.memberCount,
      };
    });

    return guilds;
  }

  public async getById(guildId: string) {
    if (!guildId) return null;
    if (guildId === "0") return null;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return null;
    return guild;
  }

  public async isReplyingToBot(message: Message): Promise<boolean> {
    if (!message.reference) return false;
    try {
      const referencedMessage = message.reference.messageId
        ? await message.channel.messages.fetch(message.reference.messageId)
        : null;
      return referencedMessage?.author?.id === client.user?.id;
    } catch {
      return false;
    }
  }
}
