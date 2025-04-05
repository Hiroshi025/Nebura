import { EmbedBuilder, GuildMember, Message } from "discord.js";

/**
 * Extends the Discord.js Message class with custom methods and properties.
 * @template T The base class to extend, which must be a subclass of Message.
 * @param Base The base class to extend.
 * @returns A new class extending the base class with additional functionality.
 */
export function ExtendMessage<T extends new (...args: any[]) => Message>(Base: T): T {
  return class extends Base {
    // === Custom Methods === //

    /**
     * Deletes the message after a specified number of seconds.
     * @param seconds The number of seconds to wait before deleting the message.
     */
    public async deleteAfter(seconds: number): Promise<void> {
      setTimeout(async () => {
        await (this as Message).delete().catch(() => {});
      }, seconds * 1000);
    }

    /**
     * Adds a series of reactions to the message in sequence.
     * @param emojis An array of emoji strings to react with.
     */
    public async reactWith(emojis: string[]): Promise<void> {
      for (const emoji of emojis) {
        await (this as Message).react(emoji).catch(() => {});
      }
    }

    /**
     * Checks if the message author has specific permissions.
     * @param permissions An array of permission bitfields to check.
     * @returns `true` if the author has all specified permissions, otherwise `false`.
     */
    public authorHasPermissions(permissions: bigint[]): boolean {
      const member = this.member as GuildMember | null;
      return member?.permissions.has(permissions) || false;
    }

    /**
     * Parses the message content into arguments, splitting by spaces.
     * @param prefix The command prefix to remove from the message content.
     * @returns An array of arguments parsed from the message content.
     */
    public parseArgs(prefix: string): string[] {
      return this.content.slice(prefix.length).trim().split(/ +/);
    }

    /**
     * Sends a reply with an advanced embed.
     * @param options Options for the embed, including title, description, and color.
     * @returns A promise resolving to the sent message.
     */
    public async replyAdvanced(options: { title?: string; description: string; color?: number }) {
      const embed = new EmbedBuilder()
        .setDescription(options.description)
        .setColor(options.color || 0x5865f2);

      if (options.title) embed.setTitle(options.title);

      return this.reply({ embeds: [embed] });
    }

    // === Useful Getters === //

    /**
     * Gets the name of the server or "Direct Messages" if the message is in a DM.
     * @returns The name of the server or "Direct Messages".
     */
    public get locationName(): string {
      return this.guild?.name || "Direct Messages";
    }

    /**
     * Checks if the message originates from a NSFW channel.
     * @returns `true` if the channel is marked as NSFW, otherwise `false`.
     */
    public get isNSFW(): boolean {
      return this.channel.isTextBased() && "nsfw" in this.channel ? this.channel.nsfw : false;
    }
  };
}