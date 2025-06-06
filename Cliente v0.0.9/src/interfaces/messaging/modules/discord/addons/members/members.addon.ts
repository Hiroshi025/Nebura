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
      try {
        // Consulta optimizada: solo trae los campos necesarios
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

        const guilds = setups.map((setup) => setup.guildId);
        logWithLabel("debug", `${JSON.stringify(guilds)} MEMBERCOUNTER ALL GUILDS`);

        await processGuildsInBatches(guilds, memberCount, 3);
      } catch (error: any) {
        logWithLabel("error", `${error.message}`);
      }
    }

    // Ejecuta al iniciar el bot
    client.on("ready", updateAllGuilds);

    // Ejecuta cada hora
    client.Jobmembercount = schedule.scheduleJob("0 * * * *", updateAllGuilds);

    // Función para actualizar los canales de un guild
    async function memberCount(guildId: string) {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          logWithLabel("warn", `Guild not found: ${guildId}`);
          return;
        }

        await guild.members.fetch().catch((err) => {
          logWithLabel("error", `Failed to fetch members for guild ${guildId}: ${err.message}`);
        });

        const settings = await main.prisma.myGuild.findFirst({
          where: { guildId },
        });

        if (!settings) {
          logWithLabel("warn", `No settings found for guild ${guildId}`);
          return;
        }

        // Procesa cada canal configurado (1-5)
        for (let i = 1; i <= 5; i++) {
          const channelId = settings[`membercount_channel${i}` as keyof typeof settings];
          const message = settings[`membercount_message${i}` as keyof typeof settings];

          // Validación de ID de canal (debe ser string y tener longitud típica de un ID de Discord)
          if (typeof channelId === "string" && /^\d{17,20}$/.test(channelId)) {
            try {
              if (typeof message === "string") {
                await updateChannel(guild, channelId, message);
                await delay(500); // Delay pequeño entre canales para evitar rate limit
              }
            } catch (err: any) {
              logWithLabel(
                "error",
                `Error updating channel ${channelId} in guild ${guildId}: ${err.message}`,
              );
            }
          }
        }
      } catch (error: any) {
        logWithLabel("error", `Error in memberCount for guild ${guildId}: ${error.message}`);
      }
    }

    // Función para actualizar el nombre del canal
    async function updateChannel(
      guild: Guild,
      channelId: string,
      channelName: string,
    ): Promise<boolean> {
      logWithLabel("debug", `MemberCount - Channel - ${guild.name} - ${channelId}, ${channelName}`);

      try {
        const channel = await guild.channels.fetch(channelId).catch((err) => {
          logWithLabel(
            "error",
            `Failed to fetch channel ${channelId} in guild ${guild.id}: ${err.message}`,
          );
          return null;
        });

        if (!channel || !channel.isVoiceBased()) {
          logWithLabel(
            "warn",
            `Channel ${channelId} is not voice-based or does not exist in guild ${guild.id}`,
          );
          return false;
        }

        const newname = replacePlaceholders(guild, channelName);

        if (channel.name !== newname) {
          await channel.setName(newname).catch((err) => {
            logWithLabel(
              "error",
              `Failed to set name for channel ${channelId} in guild ${guild.id}: ${err.message}`,
            );
          });
          return true;
        }
        return false;
      } catch (error: any) {
        logWithLabel(
          "error",
          `Error in updateChannel for guild ${guild.id}, channel ${channelId}: ${error.message}`,
        );
        return false;
      }
    }
  },
);
