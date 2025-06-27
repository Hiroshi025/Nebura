import { ChannelType, Guild, PresenceUpdateStatus } from "discord.js";
import schedule from "node-schedule";

import { Addons } from "@/interfaces/messaging/modules/discord/structure/addons";
import { main } from "@/main";
import { logWithLabel } from "@utils/functions/console";

// Utilidad para delay con promesa
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Utilidad para reemplazo de placeholders
function replacePlaceholders(guild: Guild, channelName: string): string {
  const members = guild.members.cache;
  const roles = guild.roles.cache;
  const channels = guild.channels.cache;

  const placeholderMap: Record<string, string> = {
    "{user}": guild.memberCount?.toString() || "0",
    "{users}": guild.memberCount?.toString() || "0",
    "{member}": members.filter((m) => !m.user.bot).size.toString(),
    "{members}": members.filter((m) => !m.user.bot).size.toString(),
    "{bots}": members.filter((m) => m.user.bot).size.toString(),
    "{bot}": members.filter((m) => m.user.bot).size.toString(),
    "{online}": members
      .filter((m) => m.presence?.status === PresenceUpdateStatus.Online)
      .size.toString(),
    "{offline}": members.filter((m) => !m.presence).size.toString(),
    "{idle}": members
      .filter((m) => m.presence?.status === PresenceUpdateStatus.Idle)
      .size.toString(),
    "{dnd}": members
      .filter((m) => m.presence?.status === PresenceUpdateStatus.DoNotDisturb)
      .size.toString(),
    "{allonline}": members.filter((m) => m.presence).size.toString(),
    "{onlinemember}": members
      .filter((m) => !m.user.bot && m.presence?.status === PresenceUpdateStatus.Online)
      .size.toString(),
    "{offlinemember}": members.filter((m) => !m.user.bot && !m.presence).size.toString(),
    "{idlemember}": members
      .filter((m) => !m.user.bot && m.presence?.status === PresenceUpdateStatus.Idle)
      .size.toString(),
    "{dndmember}": members
      .filter((m) => !m.user.bot && m.presence?.status === PresenceUpdateStatus.DoNotDisturb)
      .size.toString(),
    "{allonlinemember}": members.filter((m) => !m.user.bot && m.presence).size.toString(),
    "{role}": roles.size.toString(),
    "{roles}": roles.size.toString(),
    "{channel}": channels.size.toString(),
    "{channels}": channels.size.toString(),
    "{text}": channels.filter((ch) => ch.type === ChannelType.GuildText).size.toString(),
    "{texts}": channels.filter((ch) => ch.type === ChannelType.GuildText).size.toString(),
    "{voice}": channels.filter((ch) => ch.type === ChannelType.GuildVoice).size.toString(),
    "{voices}": channels.filter((ch) => ch.type === ChannelType.GuildVoice).size.toString(),
    "{stage}": channels.filter((ch) => ch.type === ChannelType.GuildStageVoice).size.toString(),
    "{stages}": channels.filter((ch) => ch.type === ChannelType.GuildStageVoice).size.toString(),
    "{thread}": channels
      .filter(
        (ch) =>
          ch.type === ChannelType.PublicThread ||
          ch.type === ChannelType.PrivateThread ||
          ch.type === ChannelType.AnnouncementThread,
      )
      .size.toString(),
    "{threads}": channels
      .filter(
        (ch) =>
          ch.type === ChannelType.PublicThread ||
          ch.type === ChannelType.PrivateThread ||
          ch.type === ChannelType.AnnouncementThread,
      )
      .size.toString(),
    "{news}": channels.filter((ch) => ch.type === ChannelType.GuildAnnouncement).size.toString(),
    "{category}": channels.filter((ch) => ch.type === ChannelType.GuildCategory).size.toString(),
    "{parent}": channels.filter((ch) => ch.type === ChannelType.GuildCategory).size.toString(),
    "{openthread}": channels.filter((ch) => ch.isThread() && !ch.archived).size.toString(),
    "{openthreads}": channels.filter((ch) => ch.isThread() && !ch.archived).size.toString(),
    "{archivedthread}": channels.filter((ch) => ch.isThread() && ch.archived).size.toString(),
    "{archivedthreads}": channels.filter((ch) => ch.isThread() && ch.archived).size.toString(),
  };

  let newName = channelName;
  for (const [placeholder, value] of Object.entries(placeholderMap)) {
    newName = newName.replace(new RegExp(placeholder, "gi"), value);
  }
  return newName;
}

// Procesamiento paralelo limitado (máx 3 guilds a la vez)
async function processGuildsInBatches(
  guildIds: string[],
  fn: (id: string) => Promise<void>,
  batchSize = 3,
) {
  for (let i = 0; i < guildIds.length; i += batchSize) {
    const batch = guildIds.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(fn));
    await delay(1000); // Pequeño delay entre lotes para evitar rate limit
  }
}

export default new Addons(
  {
    name: "Member Count",
    description: "Counts the number of members in the server and updates it in a specific channel.",
    author: "Hiroshi025",
    version: "1.0.0",
    bitfield: ["ManageChannels"],
  },
  async (client) => {
    // Función principal para actualizar todos los guilds
    async function updateAllGuilds() {
      logWithLabel("debug", "[MemberCount] Starting update of all guilds...");
      try {
        // Optimized query: only fetch necessary fields
        const setups = await main.prisma.myGuild.findMany({
          select: {
            guildId: true,
            membercount_channel1: true,
            membercount_channel2: true,
            membercount_channel3: true,
            membercount_channel4: true,
            membercount_channel5: true,
            membercount_message1: true,
            membercount_message2: true,
            membercount_message3: true,
            membercount_message4: true,
            membercount_message5: true,
          },
          where: {
            OR: Array.from({ length: 5 }, (_, i) => ({
              [`membercount_channel${i + 1}`]: { not: null, notIn: ["", "no"] },
            })),
          },
        });

        logWithLabel("debug", `[MemberCount] Found setups: ${JSON.stringify(setups)}`);
        const guilds = setups.map((setup) => setup.guildId);
        logWithLabel("debug", `[MemberCount] Guilds to process: ${JSON.stringify(guilds)}`);

        await processGuildsInBatches(guilds, memberCount, 3);
        logWithLabel("debug", "[MemberCount] Finished updating all guilds.");
      } catch (error: any) {
        logWithLabel("error", `[MemberCount] ${error.message}`);
      }
    }

    // Ejecuta al iniciar el bot
    client.on("ready", () => {
      logWithLabel("debug", "[MemberCount] Ready event: running updateAllGuilds");
      updateAllGuilds();
    });

    // Ejecuta cada hora
    client.Jobmembercount = schedule.scheduleJob("0 * * * *", () => {
      logWithLabel("debug", "[MemberCount] Scheduled task: running updateAllGuilds");
      updateAllGuilds();
    });

    // Función para actualizar los canales de un guild
    async function memberCount(guildId: string) {
      logWithLabel("debug", `[MemberCount] Processing guild: ${guildId}`);
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          logWithLabel("warn", `[MemberCount] Guild not found: ${guildId}`);
          return;
        }

        logWithLabel("debug", `[MemberCount] Fetching members for guild: ${guildId}`);
        await guild.members.fetch().catch((err) => {
          logWithLabel(
            "error",
            `[MemberCount] Failed to fetch members for guild ${guildId}: ${err.message}`,
          );
        });

        const settings = await main.prisma.myGuild.findFirst({
          where: { guildId },
        });

        logWithLabel(
          "debug",
          `[MemberCount] Settings for guild ${guildId}: ${JSON.stringify(settings)}`,
        );

        if (!settings) {
          logWithLabel("warn", `[MemberCount] No settings found for guild ${guildId}`);
          return;
        }

        // Process each configured channel (1-5)
        for (let i = 1; i <= 5; i++) {
          const channelId = settings[`membercount_channel${i}` as keyof typeof settings];
          const message = settings[`membercount_message${i}` as keyof typeof settings];

          logWithLabel(
            "debug",
            `[MemberCount] Slot ${i}: channelId=${channelId}, message=${message}`,
          );

          // Channel ID validation (must be string and typical Discord ID length)
          if (typeof channelId === "string" && /^\d{17,20}$/.test(channelId)) {
            try {
              if (typeof message === "string") {
                logWithLabel(
                  "debug",
                  `[MemberCount] Updating channel ${channelId} in guild ${guildId} with message: ${message}`,
                );
                await updateChannel(guild, channelId, message);
                await delay(500); // Small delay between channels to avoid rate limit
              } else {
                logWithLabel(
                  "warn",
                  `[MemberCount] Invalid message for channel ${channelId} in guild ${guildId}`,
                );
              }
            } catch (err: any) {
              logWithLabel(
                "error",
                `[MemberCount] Error updating channel ${channelId} in guild ${guildId}: ${err.message}`,
              );
            }
          } else {
            logWithLabel(
              "warn",
              `[MemberCount] Invalid or unconfigured channel in slot ${i} for guild ${guildId}`,
            );
          }
        }
        logWithLabel("debug", `[MemberCount] Finished processing guild: ${guildId}`);
      } catch (error: any) {
        logWithLabel(
          "error",
          `[MemberCount] Error in memberCount for guild ${guildId}: ${error.message}`,
        );
      }
    }

    // Función para actualizar el nombre del canal
    async function updateChannel(
      guild: Guild,
      channelId: string,
      channelName: string,
    ): Promise<boolean> {
      logWithLabel(
        "debug",
        `[MemberCount] updateChannel - Guild: ${guild.name} (${guild.id}) - Channel: ${channelId}, Name: ${channelName}`,
      );

      try {
        const channel = await guild.channels.fetch(channelId).catch((err) => {
          logWithLabel(
            "error",
            `[MemberCount] Failed to fetch channel ${channelId} in guild ${guild.id}: ${err.message}`,
          );
          return null;
        });

        if (!channel || !channel.isVoiceBased()) {
          logWithLabel(
            "warn",
            `[MemberCount] Channel ${channelId} is not voice-based or does not exist in guild ${guild.id}`,
          );
          return false;
        }

        const newname = replacePlaceholders(guild, channelName);
        logWithLabel("debug", `[MemberCount] Current name: ${channel.name} | New name: ${newname}`);

        if (channel.name !== newname) {
          await channel.setName(newname).catch((err) => {
            logWithLabel(
              "error",
              `[MemberCount] Failed to set name for channel ${channelId} in guild ${guild.id}: ${err.message}`,
            );
          });
          logWithLabel(
            "debug",
            `[MemberCount] Channel name ${channelId} updated successfully in guild ${guild.id}`,
          );
          return true;
        } else {
          logWithLabel(
            "debug",
            `[MemberCount] Channel name ${channelId} is already up to date in guild ${guild.id}`,
          );
        }
        return false;
      } catch (error: any) {
        logWithLabel(
          "error",
          `[MemberCount] Error in updateChannel for guild ${guild.id}, channel ${channelId}: ${error.message}`,
        );
        return false;
      }
    }
  },
);
