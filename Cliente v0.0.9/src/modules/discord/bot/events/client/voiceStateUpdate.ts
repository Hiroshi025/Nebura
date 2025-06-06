import { ChannelType } from "discord.js";

import { client, main } from "@/main";
import { Event } from "@/modules/discord/structure/utils/builders";
import { DiscordError } from "@extenders/error.extend";

export default new Event("voiceStateUpdate", async (oldState, newState) => {
  const { member, guild } = newState;
  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  const data = await main.prisma.myGuild.findFirst({ where: { guildId: guild.id } });
  if (!data) return;

  const joinToCreate = data.rooms;
  const user = member?.user;

  if (!joinToCreate || joinToCreate === "") return;
  if (!user) return;

  if (oldChannel !== newChannel && newChannel && newChannel.id === joinToCreate) {
    const voiceChannel = await guild.channels
      .create({
        name: `${user.username}-${user.discriminator}`,
        type: ChannelType.GuildVoice,
        parent: newChannel.parent,
      })
      .catch(() => {
        throw new DiscordError("Failed to create the voice channel");
      });

    const textChannel = await guild.channels
      .create({
        name: `${user.username}-${user.discriminator}-text`,
        type: ChannelType.GuildText,
        parent: newChannel.parent,
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
      .catch(() => {
        throw new DiscordError("Failed to create the text channel");
      });

    client.voiceGenerator.set(member?.id, {
      voiceChannelId: voiceChannel.id,
      textChannelId: textChannel.id,
    } as { voiceChannelId: string; textChannelId: string });
    return setTimeout(
      () =>
        member?.voice.setChannel(voiceChannel).catch(() => {
          throw new DiscordError("Failed to move the member to the voice channel");
        }),
      500,
    );
  }

  const ownedChannel = client.voiceGenerator.get(member?.id) as
    | { voiceChannelId: string; textChannelId: string }
    | undefined;
  if (
    ownedChannel &&
    oldChannel?.id === ownedChannel.voiceChannelId &&
    (!newChannel || newChannel.id !== ownedChannel.voiceChannelId)
  ) {
    client.voiceGenerator.delete(member?.id);

    oldChannel?.delete().catch(() => {
      throw new DiscordError("Failed to delete the voice channel");
    });

    const textChannel = guild.channels.cache.get(ownedChannel.textChannelId);
    textChannel?.delete().catch(() => {
      throw new DiscordError("Failed to delete the text channel");
    });
  }

  return;
});
