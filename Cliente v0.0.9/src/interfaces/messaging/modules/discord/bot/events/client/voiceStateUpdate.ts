import { ChannelType } from "discord.js";

import { Event } from "@/interfaces/messaging/modules/discord/structure/utils/builders";
import { client, main } from "@/main";
import { DiscordError } from "@utils/extenders/error.extend";

/**
 * Utility function to pause execution for a specified amount of milliseconds.
 * Useful for adding delays between asynchronous Discord actions to avoid race conditions or API errors.
 * @param ms Number of milliseconds to wait.
 * @returns Promise that resolves after the specified delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Discord voiceStateUpdate event handler.
 *
 * Handles the logic for "join to create" voice channels and their corresponding text channels.
 * - When a user joins a specific voice channel, a new voice and text channel are created for them.
 * - When the user leaves their owned voice channel, both channels are deleted.
 * - Delays are added between actions to avoid Discord API errors.
 *
 * @event voiceStateUpdate
 * @param oldState The previous VoiceState of the member.
 * @param newState The new VoiceState of the member.
 */
export default new Event("voiceStateUpdate", async (oldState, newState) => {
  const { member, guild } = newState;
  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  console.debug(`[voiceStateUpdate] Event triggered for guild: ${guild.id}, member: ${member?.id}`);
  console.debug(
    `[voiceStateUpdate] Old channel: ${oldChannel?.id ?? "none"}, New channel: ${newChannel?.id ?? "none"}`,
  );

  // Retrieve guild configuration from the database
  const data = await main.prisma.myGuild.findFirst({ where: { guildId: guild.id } });
  if (!data) {
    console.debug(`[voiceStateUpdate] No guild data found for guildId: ${guild.id}`);
    return;
  }

  const joinToCreate = data.rooms;
  const user = member?.user;

  // Validate configuration and user presence
  if (!joinToCreate || joinToCreate === "" || !data.roomcategory) {
    console.debug(`[voiceStateUpdate] joinToCreate or roomcategory not set for guildId: ${guild.id}`);
    return;
  }
  if (!user) {
    console.debug(`[voiceStateUpdate] No user found in member object`);
    return;
  }

  // Handle user joining the "join to create" channel
  if (oldChannel !== newChannel && newChannel && newChannel.id === joinToCreate) {
    console.debug(
      `[voiceStateUpdate] User ${user.username}#${user.discriminator} joined the joinToCreate channel (${joinToCreate}). Creating channels...`,
    );
    /**
     * Create a new voice channel for the user.
     * @type {import("discord.js").VoiceChannel}
     */
    const voiceChannel = await guild.channels
      .create({
        name: `${user.username}-${user.discriminator}`,
        type: ChannelType.GuildVoice,
        parent: newChannel.parent,
      })
      .catch((err) => {
        console.error(`[voiceStateUpdate] Failed to create the voice channel:`, err);
        throw new DiscordError("Failed to create the voice channel");
      });

    console.debug(`[voiceStateUpdate] Voice channel created: ${voiceChannel?.id}`);

    // Wait 500ms before creating the text channel to avoid API errors
    await delay(500);

    /**
     * Create a new text channel for the user with appropriate permissions.
     * @type {import("discord.js").TextChannel}
     */
    const textChannel = await guild.channels
      .create({
        name: `${user.username}-${user.discriminator}-text`,
        type: ChannelType.GuildText,
        parent: data.roomcategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ["ViewChannel"],
          },
          {
            id: member.id,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
          },
        ],
      })
      .catch((err) => {
        console.error(`[voiceStateUpdate] Failed to create the text channel:`, err);
        throw new DiscordError("Failed to create the text channel");
      });

    console.debug(`[voiceStateUpdate] Text channel created: ${textChannel?.id}`);

    /**
     * Store the mapping of the member's ID to their owned channels in the client.
     */
    client.voiceGenerator.set(member?.id, {
      voiceChannelId: voiceChannel.id,
      textChannelId: textChannel.id,
    } as { voiceChannelId: string; textChannelId: string });

    console.debug(`[voiceStateUpdate] voiceGenerator mapping set for member: ${member?.id}`);

    // Wait 500ms before moving the user to the new voice channel
    await delay(500);

    // Move the member to their new voice channel
    return member?.voice
      .setChannel(voiceChannel)
      .then(() => {
        console.debug(`[voiceStateUpdate] Member ${member?.id} moved to voice channel ${voiceChannel.id}`);
      })
      .catch((err) => {
        console.error(`[voiceStateUpdate] Failed to move the member to the voice channel:`, err);
        throw new DiscordError("Failed to move the member to the voice channel");
      });
  }

  /**
   * Retrieve the owned channel mapping for the member, if it exists.
   */
  const ownedChannel = client.voiceGenerator.get(member?.id) as
    | { voiceChannelId: string; textChannelId: string }
    | undefined;

  // Handle user leaving their owned voice channel
  if (
    ownedChannel &&
    oldChannel?.id === ownedChannel.voiceChannelId &&
    (!newChannel || newChannel.id !== ownedChannel.voiceChannelId)
  ) {
    console.debug(
      `[voiceStateUpdate] User ${member?.id} left their owned voice channel (${ownedChannel.voiceChannelId}). Deleting channels...`,
    );
    client.voiceGenerator.delete(member?.id);

    // Wait 500ms before deleting the voice channel to avoid API errors
    await delay(500);

    // Delete the owned voice channel
    oldChannel
      ?.delete()
      .then(() => {
        console.debug(`[voiceStateUpdate] Voice channel deleted: ${oldChannel.id}`);
      })
      .catch((err) => {
        console.error(`[voiceStateUpdate] Failed to delete the voice channel:`, err);
        throw new DiscordError("Failed to delete the voice channel");
      });

    // Wait 500ms before deleting the text channel to avoid API errors
    await delay(500);

    // Delete the owned text channel
    const textChannel = guild.channels.cache.get(ownedChannel.textChannelId);
    textChannel
      ?.delete()
      .then(() => {
        console.debug(`[voiceStateUpdate] Text channel deleted: ${ownedChannel.textChannelId}`);
      })
      .catch((err) => {
        console.error(`[voiceStateUpdate] Failed to delete the text channel:`, err);
        throw new DiscordError("Failed to delete the text channel");
      });
  }

  return;
});
