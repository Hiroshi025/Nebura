"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const node_schedule_1 = __importDefault(require("node-schedule"));
const main_1 = require("../../../main");
const addons_1 = require("../../../modules/discord/structure/addons");
const console_1 = require("../../../shared/utils/functions/console");
function delay(delayInms) {
    try {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(2);
            }, delayInms);
        });
    }
    catch (e) {
        (0, console_1.logWithLabel)("error", `${e.message}`);
    }
    return;
}
exports.default = new addons_1.Addons({
    name: "Member Count",
    description: "Counts the number of members in the server and updates it in a specific channel.",
    author: "Hiroshi025",
    version: "1.0.0",
    bitfield: ["ManageChannels"],
}, async (client) => {
    client.Jobmembercount = node_schedule_1.default.scheduleJob("0 * * * *", async function () {
        try {
            // Get all guilds with membercount setup from Prisma
            const setups = await main_1.main.prisma.myGuild.findMany({
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
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `${error.message}`);
        }
    });
    client.on("ready", async () => {
        try {
            // Get all guilds with membercount setup from Prisma
            const setups = await main_1.main.prisma.myGuild.findMany({
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
        }
        catch (error) {
            console.error("Error in ready event for membercount:", error);
        }
    });
    async function memberCount(guildId) {
        try {
            // Get the guild
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                (0, console_1.logWithLabel)("warn", `Guild not found: ${guildId}`);
                return;
            }
            // Fetch members
            await guild.members.fetch().catch((err) => {
                (0, console_1.logWithLabel)("error", `Failed to fetch members for guild ${guildId}: ${err.message}`);
            });
            // Get settings from Prisma
            const settings = await main_1.main.prisma.myGuild.findFirst({
                where: { guildId },
            });
            if (!settings) {
                (0, console_1.logWithLabel)("warn", `No settings found for guild ${guildId}`);
                return;
            }
            // Process each channel (1-25)
            for (let i = 1; i <= 5; i++) {
                const channelId = settings[`membercount_channel${i}`];
                const message = settings[`membercount_message${i}`];
                if (typeof channelId === "string" && channelId.length === 4) {
                    try {
                        if (typeof message === "string" && (await updateChannel(guild, channelId, message))) {
                            await delay(1000 * 60 * 6);
                        }
                    }
                    catch (err) {
                        (0, console_1.logWithLabel)("error", `Error updating channel ${channelId} in guild ${guildId}: ${err.message}`);
                    }
                }
            }
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Error in memberCount for guild ${guildId}: ${error.message}`);
        }
    }
    async function updateChannel(guild, channelId, channelName) {
        console.log(`MemberCount - Channel - ${guild.name} - ${channelId}, ${channelName}`);
        try {
            const channel = await guild.channels.fetch(channelId).catch((err) => {
                (0, console_1.logWithLabel)("error", `Failed to fetch channel ${channelId} in guild ${guild.id}: ${err.message}`);
                return null;
            });
            if (!channel || !channel.isVoiceBased()) {
                (0, console_1.logWithLabel)("warn", `Channel ${channelId} is not voice-based or does not exist in guild ${guild.id}`);
                return false;
            }
            let newname = String(channelName)
                .replace(/{user}/i, guild.memberCount?.toString() || "0")
                .replace(/{users}/i, guild.memberCount?.toString() || "0")
                .replace(/{member}/i, guild.members.cache.filter((member) => !member.user.bot).size.toString())
                .replace(/{members}/i, guild.members.cache.filter((member) => !member.user.bot).size.toString())
                .replace(/{bots}/i, guild.members.cache.filter((member) => member.user.bot).size.toString())
                .replace(/{bot}/i, guild.members.cache.filter((member) => member.user.bot).size.toString())
                .replace(/{online}/i, guild.members.cache
                .filter((member) => member.presence?.status === discord_js_1.PresenceUpdateStatus.Online)
                .size.toString())
                .replace(/{offline}/i, guild.members.cache.filter((member) => !member.presence).size.toString())
                .replace(/{idle}/i, guild.members.cache
                .filter((member) => member.presence?.status === discord_js_1.PresenceUpdateStatus.Idle)
                .size.toString())
                .replace(/{dnd}/i, guild.members.cache
                .filter((member) => member.presence?.status === discord_js_1.PresenceUpdateStatus.DoNotDisturb)
                .size.toString())
                .replace(/{allonline}/i, guild.members.cache.filter((member) => member.presence).size.toString())
                .replace(/{onlinemember}/i, guild.members.cache
                .filter((member) => !member.user.bot && member.presence?.status === discord_js_1.PresenceUpdateStatus.Online)
                .size.toString())
                .replace(/{offlinemember}/i, guild.members.cache
                .filter((member) => !member.user.bot && !member.presence)
                .size.toString())
                .replace(/{idlemember}/i, guild.members.cache
                .filter((member) => !member.user.bot && member.presence?.status === discord_js_1.PresenceUpdateStatus.Idle)
                .size.toString())
                .replace(/{dndmember}/i, guild.members.cache
                .filter((member) => !member.user.bot && member.presence?.status === discord_js_1.PresenceUpdateStatus.DoNotDisturb)
                .size.toString())
                .replace(/{allonlinemember}/i, guild.members.cache
                .filter((member) => !member.user.bot && member.presence)
                .size.toString())
                .replace(/{role}/i, guild.roles.cache.size.toString())
                .replace(/{roles}/i, guild.roles.cache.size.toString())
                .replace(/{channel}/i, guild.channels.cache.size.toString())
                .replace(/{channels}/i, guild.channels.cache.size.toString())
                .replace(/{text}/i, guild.channels.cache.filter((ch) => ch.type === discord_js_1.ChannelType.GuildText).size.toString())
                .replace(/{voice}/i, guild.channels.cache.filter((ch) => ch.type === discord_js_1.ChannelType.GuildVoice).size.toString())
                .replace(/{stage}/i, guild.channels.cache
                .filter((ch) => ch.type === discord_js_1.ChannelType.GuildStageVoice)
                .size.toString())
                .replace(/{thread}/i, guild.channels.cache
                .filter((ch) => ch.type === discord_js_1.ChannelType.PublicThread ||
                ch.type === discord_js_1.ChannelType.PrivateThread ||
                ch.type === discord_js_1.ChannelType.AnnouncementThread)
                .size.toString())
                .replace(/{news}/i, guild.channels.cache
                .filter((ch) => ch.type === discord_js_1.ChannelType.GuildAnnouncement)
                .size.toString())
                .replace(/{category}/i, guild.channels.cache
                .filter((ch) => ch.type === discord_js_1.ChannelType.GuildCategory)
                .size.toString())
                .replace(/{openthread}/i, guild.channels.cache.filter((ch) => ch.isThread() && !ch.archived).size.toString())
                .replace(/{archivedthread}/i, guild.channels.cache.filter((ch) => ch.isThread() && ch.archived).size.toString())
                .replace(/{texts}/i, guild.channels.cache.filter((ch) => ch.type === discord_js_1.ChannelType.GuildText).size.toString())
                .replace(/{voices}/i, guild.channels.cache.filter((ch) => ch.type === discord_js_1.ChannelType.GuildVoice).size.toString())
                .replace(/{stages}/i, guild.channels.cache
                .filter((ch) => ch.type === discord_js_1.ChannelType.GuildStageVoice)
                .size.toString())
                .replace(/{threads}/i, guild.channels.cache
                .filter((ch) => ch.type === discord_js_1.ChannelType.PublicThread ||
                ch.type === discord_js_1.ChannelType.PrivateThread ||
                ch.type === discord_js_1.ChannelType.AnnouncementThread)
                .size.toString())
                .replace(/{parent}/i, guild.channels.cache
                .filter((ch) => ch.type === discord_js_1.ChannelType.GuildCategory)
                .size.toString())
                .replace(/{openthreads}/i, guild.channels.cache.filter((ch) => ch.isThread() && !ch.archived).size.toString())
                .replace(/{archivedthreads}/i, guild.channels.cache.filter((ch) => ch.isThread() && ch.archived).size.toString());
            if (channel.name !== newname) {
                await channel.setName(newname).catch((err) => {
                    (0, console_1.logWithLabel)("error", `Failed to set name for channel ${channelId} in guild ${guild.id}: ${err.message}`);
                });
                return true;
            }
            return false;
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", `Error in updateChannel for guild ${guild.id}, channel ${channelId}: ${error.message}`);
            return false;
        }
    }
});
