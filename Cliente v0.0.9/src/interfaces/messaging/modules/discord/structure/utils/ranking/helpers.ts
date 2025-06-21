import { Profile } from "discord-arts";
import {
	AttachmentBuilder, GuildChannel, Message, PermissionFlagsBits, TextChannel
} from "discord.js";

import { client, main } from "@/main";
import { LevelConfig, UserLevel } from "@prisma/client";
import { logWithLabel } from "@utils/functions/console";

import { MyClient } from "../../../client";
import { ACHIEVEMENTS, DAILY_QUESTS, MAX_LEVEL, SPAM_PENALTY_XP } from "./constant";

// Define Achievement type if not imported from elsewhere
type Achievement = {
  id: string;
  name: string;
  type: "LEVEL" | "MESSAGES";
  requirement: number;
  xpReward?: number;
};

const cooldown = new Set<string>();

/**
 * Enhanced ranking system for Discord with streaks, leaderboards, quests, and more
 *
 * @param message
 * @param client
 * @returns
 */
export async function Ranking(message: Message, client: MyClient) {
  if (!message.guild || !message.channel || message.author.bot || !client.user) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const currentDate = new Date();
  const currentDay = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
  const currentWeek = getWeekNumber(currentDate); // Helper function to get week number
  const currentMonth = currentDate.getMonth() + 1;

  // 1. Cooldown and anti-spam check
  if (cooldown.has(userId)) {
    logWithLabel("info", `User: ${message.author.tag} | Cooldown activated.`, {
      customLabel: "Rank",
    });
    return;
  }

  // Check for spam (7. Penalizaciones por spam)
  if (isSpam(message)) {
    await handleSpamPenalty(message, client);
    return;
  }

  // Fetch server configuration
  let rankingConfig = await main.prisma.levelConfig.findFirst({
    where: { guildId, status: true },
  });

  // Create default config if none exists
  if (!rankingConfig) {
    rankingConfig = await main.prisma.levelConfig.create({
      data: { guildId, channelId: null, status: true },
    });
  }

  // Skip if ranking is disabled
  if (!rankingConfig.status) {
    logWithLabel("info", `Ranking is disabled for guild: ${guildId}`, {
      customLabel: "Rank",
    });
    return;
  }

  // 5. Channel bonus check
  const channelBonus = await getChannelBonus(message.channel.id, rankingConfig);

  // Base XP with possible channel bonus
  const baseXp = Math.floor(Math.random() * (25 - 15 + 1) + 15);
  const xpAmount = baseXp + (channelBonus ? Math.floor(baseXp * channelBonus.multiplier) : 0);

  // Get or create user data
  let user = await main.prisma.userLevel.findFirst({
    where: { guildId, userId },
    include: { streaks: true, quests: true, achievements: true },
  });

  // 2. Streak system (Sistema de rachas)
  const streakUpdate = await updateStreak(userId, guildId, currentDay);
  const streakBonus =
    streakUpdate.currentStreak > 1
      ? Math.floor(xpAmount * (0.1 * Math.min(streakUpdate.currentStreak, 10)))
      : 0; // Max 100% bonus for 10-day streak

  // 4. Check and update quests (Misiones o retos)
  const questUpdates = await updateQuests(userId, guildId, message);
  const questXp = questUpdates.completedQuests.reduce((sum, quest) => sum + quest.xpReward, 0);

  // Total XP with all bonuses
  const totalXp = xpAmount + streakBonus + questXp;

  // Update or create user data
  user = await main.prisma.userLevel.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: {
      xp: { increment: totalXp },
      lastActive: currentDate,
      // Update weekly/monthly counters for leaderboards
      weeklyXp: { increment: totalXp },
      monthlyXp: { increment: totalXp },
      totalMessages: { increment: 1 },
    },
    create: {
      guildId,
      userId,
      xp: totalXp,
      level: 0,
      lastActive: currentDate,
      weeklyXp: totalXp,
      monthlyXp: totalXp,
      totalMessages: 1,
      streaks: {
        create: {
          lastActive: currentDay,
          currentStreak: 1,
          longestStreak: 1,
        },
      },
      quests: {
        create: {
          dailyProgress: {},
          dailyCompleted: {},
          weeklyProgress: {},
          weeklyCompleted: {},
        },
      },
      achievements: {
        create: {
          achievements: [],
        },
      },
    },
    include: { streaks: true, quests: true, achievements: true },
  });

  if (!user) return;
  let xp = user.xp;
  let level = user.level;
  let prestige = user.prestige;

  // Log activity
  logWithLabel(
    "info",
    `User: ${message.author.tag} | XP: ${xp}/${level * 100} | Level: ${level} | Streak: ${streakUpdate.currentStreak} | Earned: ${totalXp} XP (Base: ${xpAmount}, Streak: ${streakBonus}, Quests: ${questXp})`,
    {
      customLabel: "Rank",
    },
  );

  // Check for level up
  const requiredXp = calculateRequiredXp(level, prestige);
  if (xp >= requiredXp) {
    // 6. Prestige system (Sistema de prestigio)
    if (level >= MAX_LEVEL) {
      await handlePrestige(user, message, client);
      return;
    }

    // Normal level up
    level++;
    xp = xp - requiredXp;

    // 8. Check for achievements (Logros y medallas)
    const newAchievements = await checkAchievements(userId, guildId, level, user.totalMessages);

    // Update user data
    await main.prisma.userLevel.update({
      where: { id: user.id },
      data: { xp, level },
    });

    // Send level up notification
    await sendLevelUpNotification(message, client, rankingConfig, {
      level,
      prestige,
      streak: streakUpdate.currentStreak,
      achievements: newAchievements.map((a) => ({
        ...a,
        type: a.type as "LEVEL" | "MESSAGES",
      })),
    });

    // Set cooldown
    cooldown.add(userId);
    setTimeout(() => cooldown.delete(userId), 60000);
  }

  // 3. Check weekly/monthly leaderboard resets
  await checkLeaderboardReset(guildId, currentWeek, currentMonth);
}

// Helper functions for new features:

// 2. Streak system
async function updateStreak(userId: string, guildId: string, currentDay: string) {
  // First, try to find the existing streak
  const existingStreak = await main.prisma.streak.findUnique({
    where: { userId_guildId: { userId, guildId } },
  });

  if (existingStreak) {
    const incrementStreak = isYesterday(existingStreak.lastActive, currentDay);
    const newCurrentStreak = incrementStreak ? existingStreak.currentStreak + 1 : 1;
    const newLongestStreak = Math.max(existingStreak.longestStreak, newCurrentStreak);

    const updatedStreak = await main.prisma.streak.update({
      where: { userId_guildId: { userId, guildId } },
      data: {
        lastActive: currentDay,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
      },
    });
    return updatedStreak;
  } else {
    const createdStreak = await main.prisma.streak.create({
      data: {
        userId,
        guildId,
        lastActive: currentDay,
        currentStreak: 1,
        longestStreak: 1,
      },
    });
    return createdStreak;
  }
}

// 3. Leaderboard system
async function checkLeaderboardReset(guildId: string, currentWeek: number, currentMonth: number) {
  const lastReset = await main.prisma.leaderboardReset.findFirst({ where: { guildId } });

  if (!lastReset || lastReset.lastWeek !== currentWeek) {
    // Weekly reset
    await main.prisma.$transaction([
      main.prisma.weeklyLeaderboard.create({
        data: {
          guildId,
          week: lastReset?.lastWeek || currentWeek,
          data: await getTopUsers(guildId, "weeklyXp", 10),
        },
      }),
      main.prisma.userLevel.updateMany({
        where: { guildId },
        data: { weeklyXp: 0 },
      }),
      main.prisma.leaderboardReset.upsert({
        where: { guildId },
        update: { lastWeek: currentWeek },
        create: { guildId, lastWeek: currentWeek, lastMonth: currentMonth },
      }),
    ]);

    // Award weekly top users
    await awardTopUsers(guildId, "weekly");
  }

  if (!lastReset || lastReset.lastMonth !== currentMonth) {
    // Monthly reset
    await main.prisma.$transaction([
      main.prisma.monthlyLeaderboard.create({
        data: {
          guildId,
          month: lastReset?.lastMonth || currentMonth,
          year: new Date().getFullYear(),
          data: await getTopUsers(guildId, "monthlyXp", 10),
        },
      }),
      main.prisma.userLevel.updateMany({
        where: { guildId },
        data: { monthlyXp: 0 },
      }),
      main.prisma.leaderboardReset.upsert({
        where: { guildId },
        update: { lastMonth: currentMonth },
        create: { guildId, lastWeek: currentWeek, lastMonth: currentMonth },
      }),
    ]);

    // Award monthly top users
    await awardTopUsers(guildId, "monthly");
  }
}

// 4. Quest system
async function updateQuests(userId: string, guildId: string, message: Message) {
  const quests = await main.prisma.userQuests.findUnique({
    where: { userId_guildId: { userId, guildId } },
  });

  if (!quests) return { completedQuests: [], updatedQuests: quests };

  const completedQuests = [];
  // Ensure correct typing and initialization for dailyCompleted and dailyProgress
  const updatedQuests = { ...quests };

  // Make sure dailyCompleted and dailyProgress are objects
  if (!updatedQuests.dailyCompleted || typeof updatedQuests.dailyCompleted !== "object") {
    updatedQuests.dailyCompleted = {};
  }
  if (!updatedQuests.dailyProgress || typeof updatedQuests.dailyProgress !== "object") {
    updatedQuests.dailyProgress = {};
  }

  // Check daily quests
  for (const quest of DAILY_QUESTS) {
    //const progressField = `dailyProgress.${quest.id}`;
    //const completedField = `dailyCompleted.${quest.id}`;

    const dailyProgress = (quests.dailyProgress ?? {}) as Record<string, number>;
    const dailyCompleted = (quests.dailyCompleted ?? {}) as Record<string, boolean>;

    if (quest.check(message, dailyProgress[quest.id] || 0)) {
      const newProgress = (dailyProgress[quest.id] || 0) + 1;

      if (newProgress >= quest.requirement && !dailyCompleted[quest.id]) {
        completedQuests.push({
          id: quest.id,
          name: quest.name,
          xpReward: quest.xpReward,
        });
        (updatedQuests.dailyCompleted as Record<string, boolean>)[quest.id] = true;
      }

      (updatedQuests.dailyProgress as Record<string, number>)[quest.id] = newProgress;
    }
  }

  // Check weekly quests (similar logic)

  // Save updated quests
  await main.prisma.userQuests.update({
    where: { userId_guildId: { userId, guildId } },
    data: {
      dailyProgress: updatedQuests.dailyProgress ?? {},
      dailyCompleted: updatedQuests.dailyCompleted ?? {},
      weeklyProgress: updatedQuests.weeklyProgress ?? {},
      weeklyCompleted: updatedQuests.weeklyCompleted ?? {},
    },
  });

  return { completedQuests, updatedQuests };
}

// 5. Channel bonus
async function getChannelBonus(channelId: string, rankingConfig: LevelConfig) {
  if (!rankingConfig.bonusChannels) return null;
  let bonusChannels: any[] = [];
  if (Array.isArray(rankingConfig.bonusChannels)) {
    bonusChannels = rankingConfig.bonusChannels;
  } else if (typeof rankingConfig.bonusChannels === "string") {
    try {
      bonusChannels = JSON.parse(rankingConfig.bonusChannels);
    } catch {
      return null;
    }
  }
  return bonusChannels.find((b: any) => b.channelId === channelId);
}

// 6. Prestige system
async function handlePrestige(user: UserLevel, message: Message, _client: MyClient) {
  const prestige = user.prestige + 1;
  const newLevel = 0;
  const newXp = 0;

  await main.prisma.userLevel.update({
    where: { id: user.id },
    data: {
      level: newLevel,
      xp: newXp,
      prestige,
      // Reset some stats but keep others
      weeklyXp: 0,
      monthlyXp: 0,
      // Add to prestige history
      prestigeHistory: {
        create: {
          date: new Date(),
          levelAchieved: user.level,
        },
      },
    },
  });

  // Send prestige notification
  const buffer = await Profile(user.userId, {
    customTag: `Prestige ${prestige} achieved!`,
    squareAvatar: true,
    borderColor: ["#ffd700", "#ff8800"],
    presenceStatus: "online",
    badgesFrame: true,
    customBackground: "https://i.imgur.com/LWcWzlc.png",
    backgroundBrightness: 100,
    moreBackgroundBlur: true,
    customBadges: ["./crown.png"],
    rankData: {
      currentXp: 0,
      requiredXp: calculateRequiredXp(0, prestige),
      rank: 1,
      level: 0,
      barColor: "#ffe066",
      levelColor: "#ff8800",
      autoColorRank: true,
    },
  });

  const attachment = new AttachmentBuilder(buffer, { name: "prestige.png" });

  try {
    await (message.channel as TextChannel).send({
      content: `🎉 ${message.author} has reached Prestige ${prestige}!`,
      files: [attachment],
    });
  } catch {
    await message.author.send({
      content: `🎉 You've reached Prestige ${prestige}!`,
      files: [attachment],
    });
  }
}

// 7. Anti-spam system
async function handleSpamPenalty(message: Message, _client: MyClient) {
  const guildId = message.guild?.id;
  const userId = message.author.id;

  if (!guildId) return;

  // Apply XP penalty
  await main.prisma.userLevel.update({
    where: { guildId_userId: { guildId, userId } },
    data: { xp: { decrement: SPAM_PENALTY_XP } },
  });

  // Log and notify
  logWithLabel("warning", `Spam detected from ${message.author.tag}, applying XP penalty`, {
    customLabel: "Ranking",
    context: { userId, userName: message.author.username },
  });

  try {
    await message.author.send(`⚠️ Please avoid spamming! ${SPAM_PENALTY_XP} XP has been deducted.`);
  } catch (err) {
    console.error("Could not send spam warning DM", err);
  }
}

// 8. Achievement system
async function checkAchievements(
  userId: string,
  guildId: string,
  level: number,
  messageCount: number,
) {
  const unlockedAchievements = [];
  const userAchievements = await main.prisma.userAchievements.findUnique({
    where: { userId_guildId: { userId, guildId } },
  });

  // Check level-based achievements
  for (const achievement of ACHIEVEMENTS) {
    if (!userAchievements?.achievements.includes(achievement.id)) {
      if (
        (achievement.type === "LEVEL" && level >= achievement.requirement) ||
        (achievement.type === "MESSAGES" && messageCount >= achievement.requirement)
      ) {
        unlockedAchievements.push(achievement);
      }
    }
  }

  if (unlockedAchievements.length > 0) {
    await main.prisma.userAchievements.upsert({
      where: { userId_guildId: { userId, guildId } },
      update: {
        achievements: { push: unlockedAchievements.map((a) => a.id) },
      },
      create: {
        userId,
        guildId,
        achievements: unlockedAchievements.map((a) => a.id),
      },
    });
  }

  return unlockedAchievements;
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
}

function isYesterday(lastDateStr: string, currentDateStr: string): boolean {
  const lastDate = new Date(lastDateStr);
  const currentDate = new Date(currentDateStr);
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    lastDate.getDate() === yesterday.getDate() &&
    lastDate.getMonth() === yesterday.getMonth() &&
    lastDate.getFullYear() === yesterday.getFullYear()
  );
}

function calculateRequiredXp(level: number, prestige: number): number {
  const baseXp = level * 100;
  return prestige > 0 ? baseXp * (1 + prestige * 0.5) : baseXp; // 50% more XP per prestige level
}

function isSpam(_message: Message): boolean {
  // Implement your spam detection logic
  // Example: Check for repeated messages, too many messages in short time, etc.
  return false;
}

/**
 * Sends a level up notification to the appropriate channel or user
 */
async function sendLevelUpNotification(
  message: Message,
  client: MyClient,
  rankingConfig: LevelConfig,
  details: {
    level: number;
    prestige: number;
    streak: number;
    achievements: Achievement[];
  },
) {
  const { level, prestige, streak, achievements } = details;
  const userId = message.author.id;
  let notificationChannel: GuildChannel | null = null;

  // Try to fetch the configured notification channel
  if (rankingConfig.channelId) {
    try {
      notificationChannel = (await client.channels.fetch(rankingConfig.channelId)) as GuildChannel;
    } catch (err) {
      console.error("Failed to fetch notification channel:", err);
    }
  }

  // Fall back to current channel if no notification channel
  if (!notificationChannel) {
    notificationChannel = message.channel as GuildChannel;
  }

  // Prepare achievement text if any
  const achievementText =
    achievements.length > 0
      ? `\n\n**Achievements Unlocked:**\n${achievements.map((a) => `🏆 ${a.name}`).join("\n")}`
      : "";

  // Prepare streak text if applicable
  const streakText = streak > 3 ? `\n🔥 Streak: ${streak} days!` : "";

  // Create the profile image with level up info
  const buffer = await Profile(userId, {
    customTag: `Level Up! ${level}${prestige > 0 ? ` (Prestige ${prestige})` : ""}`,
    squareAvatar: true,
    borderColor: ["#00bfff", "#ff00cc"],
    presenceStatus: "online",
    badgesFrame: true,
    customBackground: "https://i.imgur.com/LWcWzlc.png",
    backgroundBrightness: 90,
    moreBackgroundBlur: true,
    customBadges: achievements.length > 0 ? achievements.map(() => "./assets/badge.png") : [],
    rankData: {
      currentXp: level * 100, // Puedes ajustar según tu lógica real
      requiredXp: calculateRequiredXp(level, prestige),
      rank: 1,
      level: level,
      barColor: "#fcdce1",
      levelColor: "#ada8c6",
      autoColorRank: true,
    },
  });

  const attachment = new AttachmentBuilder(buffer, { name: "levelup.png" });

  try {
    // Check if we can send to the channel
    if (notificationChannel.permissionsFor(client.user!)?.has(PermissionFlagsBits.SendMessages)) {
      await (notificationChannel as TextChannel).send({
        content: `🎉 ${message.author} has leveled up to level ${level}${prestige > 0 ? ` (Prestige ${prestige})` : ""}!${streakText}${achievementText}`,
        files: [attachment],
      });
    } else {
      // Fall back to DM
      await message.author.send({
        content: `🎉 You've leveled up to level ${level}${prestige > 0 ? ` (Prestige ${prestige})` : ""}!${streakText}${achievementText}`,
        files: [attachment],
      });
    }
  } catch (error) {
    console.error("Failed to send level up notification:", error);
  }
}

/**
 * Gets the top users for a specific XP category
 */
export async function getTopUsers(
  guildId: string,
  xpField: "weeklyXp" | "monthlyXp" | "xp",
  limit: number = 10,
) {
  return await main.prisma.userLevel.findMany({
    where: { guildId },
    orderBy: { [xpField]: "desc" },
    take: limit,
    select: {
      userId: true, // <-- Esto debe ser string
      level: true,
      [xpField]: true,
      prestige: true,
      // Si necesitas el historial de prestigio, usa otro nombre:
      // prestigeHistory: true,
    },
  });
}

/**
 * Awards top users at the end of weekly/monthly periods
 */
async function awardTopUsers(guildId: string, period: "weekly" | "monthly") {
  const xpField = period === "weekly" ? "weeklyXp" : "monthlyXp";
  const topUsers = await getTopUsers(guildId, xpField, 3);

  // Get the server's reward configuration
  const config = await main.prisma.levelConfig.findUnique({
    where: { guildId },
    select: { [period === "weekly" ? "weeklyRewards" : "monthlyRewards"]: true },
  });

  const rewards = config?.[period === "weekly" ? "weeklyRewards" : "monthlyRewards"] || [
    { position: 1, xp: 500, roleId: null },
    { position: 2, xp: 300, roleId: null },
    { position: 3, xp: 200, roleId: null },
  ];

  // Apply rewards
  for (const user of topUsers) {
    const reward = rewards.find((r) => r.position === topUsers.indexOf(user) + 1);
    // Si user.userId es un array, necesitas obtener el string correcto:
    // Por ejemplo, si tienes user.userId como [{...}], usa user.userId[0].userId
    // Pero lo correcto es que sea string, así:
    const topUserId = typeof user.userId === "string" ? user.userId : user.userId[0]?.userId;
    if (!reward) continue;
    if (!topUserId) continue;

    await main.prisma.userLevel.update({
      where: { guildId_userId: { guildId, userId: topUserId } },
      data: { xp: { increment: reward.xp } },
    });

    if (reward.roleId) {
      try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(topUserId);
        await member.roles.add(reward.roleId);
      } catch (error) {
        console.error(`Failed to add reward role to user ${topUserId}:`, error);
      }
    }
  }

  // Log the rewards
  logWithLabel("info", `Awarded ${period} top users in guild ${guildId}`, {
    customLabel: "Rank",
  });
}
