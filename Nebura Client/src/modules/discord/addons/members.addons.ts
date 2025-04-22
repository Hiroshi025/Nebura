import { ChannelType, Guild, PresenceUpdateStatus } from "discord.js";
import schedule from "node-schedule";

import { main } from "@/main";
import { Addons } from "@/modules/discord/structure/addons";
import { logWithLabel } from "@utils/functions/console";

function delay(delayInms: number) {
  try {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(2);
      }, delayInms);
    });
  } catch (e: any) {
    logWithLabel("error", `${e.message}`);
  }

  return;
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
    client.Jobmembercount = schedule.scheduleJob("0 * * * *", async function () {
      try {
        // Get all guilds with membercount setup from Prisma
        const setups = await main.prisma.myGuild.findMany({
          where: {
            OR: Array.from({ length: 5 }, (_, i) => ({
              [`membercount_channel${i + 1}`]: { not: null, notIn: ["", "no"] },
            })),
          },
        });

        const guilds = setups.map((setup) => setup.guildId);
        console.log(`${JSON.stringify(guilds)} MEMBERCOUNTER ALL GUILDS`);

        // Process all guilds
        for (const guildId of guilds) {
          await memberCount(guildId);
          await delay(1000);
        }
      } catch (error: any) {
        logWithLabel("error", `${error.message}`);
      }
    });

    client.on("ready", async () => {
      try {
        // Get all guilds with membercount setup from Prisma
        const setups = await main.prisma.myGuild.findMany({
          where: {
            OR: Array.from({ length: 5 }, (_, i) => ({
              [`membercount_channel${i + 1}`]: { not: null, notIn: ["", "no"] },
            })),
          },
        });

        const guilds = setups.map((setup) => setup.guildId);
        console.log(`${JSON.stringify(guilds)} MEMBERCOUNTER ALL GUILDS`);

        // Process all guilds
        for (const guildId of guilds) {
          await memberCount(guildId);
          await delay(1000);
        }

        // Job is already scheduled, no need to start it again
      } catch (error) {
        console.error("Error in ready event for membercount:", error);
      }
    });

    async function memberCount(guildId: string) {
      try {
        // Get the guild
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          logWithLabel("warn", `Guild not found: ${guildId}`);
          return;
        }

        // Fetch members
        await guild.members.fetch().catch((err) => {
          logWithLabel("error", `Failed to fetch members for guild ${guildId}: ${err.message}`);
        });

        // Get settings from Prisma
        const settings = await main.prisma.myGuild.findFirst({
          where: { guildId },
        });

        if (!settings) {
          logWithLabel("warn", `No settings found for guild ${guildId}`);
          return;
        }

        // Process each channel (1-25)
        for (let i = 1; i <= 5; i++) {
          const channelId = settings[`membercount_channel${i}` as keyof typeof settings];
          const message = settings[`membercount_message${i}` as keyof typeof settings];

          if (typeof channelId === "string" && channelId.length === 4) {
            try {
              if (typeof message === "string" && (await updateChannel(guild, channelId, message))) {
                await delay(1000 * 60 * 6);
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

    async function updateChannel(
      guild: Guild,
      channelId: string,
      channelName: string,
    ): Promise<boolean> {
      console.log(`MemberCount - Channel - ${guild.name} - ${channelId}, ${channelName}`);

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

        let newname = String(channelName)
          .replace(/{user}/i, guild.memberCount?.toString() || "0")
          .replace(/{users}/i, guild.memberCount?.toString() || "0")
          .replace(
            /{member}/i,
            guild.members.cache.filter((member) => !member.user.bot).size.toString(),
          )
          .replace(
            /{members}/i,
            guild.members.cache.filter((member) => !member.user.bot).size.toString(),
          )
          .replace(
            /{bots}/i,
            guild.members.cache.filter((member) => member.user.bot).size.toString(),
          )
          .replace(
            /{bot}/i,
            guild.members.cache.filter((member) => member.user.bot).size.toString(),
          )
          .replace(
            /{online}/i,
            guild.members.cache
              .filter((member) => member.presence?.status === PresenceUpdateStatus.Online)
              .size.toString(),
          )
          .replace(
            /{offline}/i,
            guild.members.cache.filter((member) => !member.presence).size.toString(),
          )
          .replace(
            /{idle}/i,
            guild.members.cache
              .filter((member) => member.presence?.status === PresenceUpdateStatus.Idle)
              .size.toString(),
          )
          .replace(
            /{dnd}/i,
            guild.members.cache
              .filter((member) => member.presence?.status === PresenceUpdateStatus.DoNotDisturb)
              .size.toString(),
          )
          .replace(
            /{allonline}/i,
            guild.members.cache.filter((member) => member.presence).size.toString(),
          )
          .replace(
            /{onlinemember}/i,
            guild.members.cache
              .filter(
                (member) =>
                  !member.user.bot && member.presence?.status === PresenceUpdateStatus.Online,
              )
              .size.toString(),
          )
          .replace(
            /{offlinemember}/i,
            guild.members.cache
              .filter((member) => !member.user.bot && !member.presence)
              .size.toString(),
          )
          .replace(
            /{idlemember}/i,
            guild.members.cache
              .filter(
                (member) =>
                  !member.user.bot && member.presence?.status === PresenceUpdateStatus.Idle,
              )
              .size.toString(),
          )
          .replace(
            /{dndmember}/i,
            guild.members.cache
              .filter(
                (member) =>
                  !member.user.bot && member.presence?.status === PresenceUpdateStatus.DoNotDisturb,
              )
              .size.toString(),
          )
          .replace(
            /{allonlinemember}/i,
            guild.members.cache
              .filter((member) => !member.user.bot && member.presence)
              .size.toString(),
          )
          .replace(/{role}/i, guild.roles.cache.size.toString())
          .replace(/{roles}/i, guild.roles.cache.size.toString())
          .replace(/{channel}/i, guild.channels.cache.size.toString())
          .replace(/{channels}/i, guild.channels.cache.size.toString())
          .replace(
            /{text}/i,
            guild.channels.cache.filter((ch) => ch.type === ChannelType.GuildText).size.toString(),
          )
          .replace(
            /{voice}/i,
            guild.channels.cache.filter((ch) => ch.type === ChannelType.GuildVoice).size.toString(),
          )
          .replace(
            /{stage}/i,
            guild.channels.cache
              .filter((ch) => ch.type === ChannelType.GuildStageVoice)
              .size.toString(),
          )
          .replace(
            /{thread}/i,
            guild.channels.cache
              .filter(
                (ch) =>
                  ch.type === ChannelType.PublicThread ||
                  ch.type === ChannelType.PrivateThread ||
                  ch.type === ChannelType.AnnouncementThread,
              )
              .size.toString(),
          )
          .replace(
            /{news}/i,
            guild.channels.cache
              .filter((ch) => ch.type === ChannelType.GuildAnnouncement)
              .size.toString(),
          )
          .replace(
            /{category}/i,
            guild.channels.cache
              .filter((ch) => ch.type === ChannelType.GuildCategory)
              .size.toString(),
          )
          .replace(
            /{openthread}/i,
            guild.channels.cache.filter((ch) => ch.isThread() && !ch.archived).size.toString(),
          )
          .replace(
            /{archivedthread}/i,
            guild.channels.cache.filter((ch) => ch.isThread() && ch.archived).size.toString(),
          )
          .replace(
            /{texts}/i,
            guild.channels.cache.filter((ch) => ch.type === ChannelType.GuildText).size.toString(),
          )
          .replace(
            /{voices}/i,
            guild.channels.cache.filter((ch) => ch.type === ChannelType.GuildVoice).size.toString(),
          )
          .replace(
            /{stages}/i,
            guild.channels.cache
              .filter((ch) => ch.type === ChannelType.GuildStageVoice)
              .size.toString(),
          )
          .replace(
            /{threads}/i,
            guild.channels.cache
              .filter(
                (ch) =>
                  ch.type === ChannelType.PublicThread ||
                  ch.type === ChannelType.PrivateThread ||
                  ch.type === ChannelType.AnnouncementThread,
              )
              .size.toString(),
          )
          .replace(
            /{parent}/i,
            guild.channels.cache
              .filter((ch) => ch.type === ChannelType.GuildCategory)
              .size.toString(),
          )
          .replace(
            /{openthreads}/i,
            guild.channels.cache.filter((ch) => ch.isThread() && !ch.archived).size.toString(),
          )
          .replace(
            /{archivedthreads}/i,
            guild.channels.cache.filter((ch) => ch.isThread() && ch.archived).size.toString(),
          );

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
