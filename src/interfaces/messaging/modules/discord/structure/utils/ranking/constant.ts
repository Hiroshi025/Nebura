import { GuildChannel, Message } from "discord.js";

/**
 * Anime theme names for the ranking system.
 * Used to categorize users or quests by anime genre.
 */
export const ANIME_THEMES = {
  SHONEN: "¡Plus Ultra!",
  SHOJO: "Princesa Mágica",
  ISEKAI: "Reencarnado en otro mundo",
  MECHA: "Piloto de Mechas",
  SPORTS: "Campeón del Deporte",
};

/**
 * Daily quests definitions.
 * Each quest contains requirements, rewards, and a check function to track progress.
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Message | discord.js Message}
 */
export const DAILY_QUESTS = [
  {
    id: "daily_training",
    name: "¡Entrenamiento Diario!",
    description: "Send 15 messages (Effort surpasses talent!)",
    requirement: 15,
    xpReward: 150,
    /**
     * Check function to increment progress.
     * @param _ Message instance (not used)
     * @param p Current progress
     * @returns Updated progress
     */
    check: (_: Message, p: number) => p + 1,
    animation: "⚡💪",
  },
  {
    id: "heroic_rescue",
    name: "¡Rescate Heroico!",
    description: "Help 3 users in #ayuda (Protect the weak!)",
    requirement: 3,
    xpReward: 300,
    /**
     * Check if the message is in #ayuda and contains a question.
     * @param m Message instance
     * @param p Current progress
     * @returns Updated progress
     */
    check: (m: Message, p: number) =>
      (m.channel as GuildChannel).name === "ayuda" && m.content.includes("?") ? p + 1 : p,
    animation: "🛡️🙌",
  },
  {
    id: "power_of_friendship",
    name: "¡Poder de la Amistad!",
    description: "Mention 5 different friends",
    requirement: 5,
    xpReward: 200,
    /**
     * Check if the message mentions at least one user.
     * @param m Message instance
     * @param p Current progress
     * @returns Updated progress
     */
    check: (m: Message, p: number) => (m.mentions.users.size >= 1 ? p + 1 : p),
    animation: "✨👥",
  },
];

/**
 * Weekly quests definitions.
 * These quests are more challenging and offer higher rewards.
 */
export const WEEKLY_QUESTS = [
  {
    id: "tournament_arc",
    name: "¡Arco Torneo!",
    description: "Earn 5000 XP this week (Show your strength!)",
    requirement: 5000,
    xpReward: 1500,
    animation: "🏆🔥",
  },
  {
    id: "secret_technique",
    name: "¡Técnica Secreta!",
    description: "Reach level 15 (Master your hidden power!)",
    requirement: 15,
    xpReward: 1000,
    animation: "🌀💥",
  },
];

/**
 * List of achievements that users can unlock.
 * Each achievement has a type, requirement, and a cutscene.
 */
export const ACHIEVEMENTS = [
  {
    id: "protagonist",
    name: "¡Eres el Protagonista!",
    type: "LEVEL",
    requirement: 1,
    description: "Send your first epic message",
    cutscene: "The adventure begins! 🌅",
  },
  {
    id: "bankai",
    name: "¡Bankai Desbloqueado!",
    type: "LEVEL",
    requirement: 10,
    description: "Reach level 10",
    cutscene: "Spiritual power unleashed! ⚔️💢",
  },
  {
    id: "nakama",
    name: "¡Nakama Power!",
    type: "SOCIAL",
    requirement: 50,
    description: "Make 50 friends",
    cutscene: "True power lies in friends! 👫🌈",
  },
  {
    id: "hokage",
    name: "¡Sueño del Hokage!",
    type: "PRESTIGE",
    requirement: 3,
    description: "Reach Prestige 3",
    cutscene: "The whole village believes in you! 🍥🌪️",
  },
];

/**
 * The maximum level a user can reach.
 */
export const MAX_LEVEL = 100;

/**
 * XP penalty applied for spam detection.
 */
export const SPAM_PENALTY_XP = 100;

/**
 * Anime rank titles and their corresponding levels.
 * Used to assign titles and emojis to users based on their level.
 */
export const ANIME_RANKS = [
  { level: 0, title: "Civil 🎒", emoji: "👶" },
  { level: 5, title: "Aprendiz Ninja �", emoji: "🎋" },
  { level: 10, title: "Genin 🌱", emoji: "🍃" },
  { level: 20, title: "Chūnin ⚔️", emoji: "🌙" },
  { level: 30, title: "Jōnin 🐺", emoji: "🌀" },
  { level: 50, title: "Kage 🗻", emoji: "🌋" },
  { level: 75, title: "Héroe S 🌟", emoji: "✨" },
  { level: 100, title: "Dios Shinigami ☯️", emoji: "⚛️" },
];

/**
 * Interactive anime stories for different user progress stages.
 * Used to enhance user engagement with narrative elements.
 */
export const ANIME_STORIES = {
  BEGINNER: [
    "A normal day at the Academy... until the Demon Lord appears! 😈",
    "The master gives you your first mission: Talk to 5 people! 🗣️",
  ],
  INTERMEDIATE: [
    "A level B enemy appears! Defeat 3 spammers to protect the server! 💥",
    "You discover a legendary artifact: The Emoji of Power! 🔥",
  ],
  ADVANCED: [
    "Clan war! Join a studio to gain special skills 🏯",
    "Final boss alert! Everyone vs the level 100 Spammer Overlord! 👹",
  ],
};

/**
 * Anime studios (guilds) that users can join for special bonuses.
 * Each studio has a unique bonus and joining requirement.
 */
export const ANIME_STUDIOS = [
  {
    name: "Studio Pierrot 🌙",
    bonus: "XP +10% on night missions",
    requirement: "Level 20+",
  },
  {
    name: "Ufotable 🔥",
    bonus: "Epic visual effects on achievements",
    requirement: "Prestige 1+",
  },
  {
    name: "Kyoto Animation 🎆",
    bonus: "Double story progression",
    requirement: "50+ friends",
  },
];

/**
 * Seasonal events that provide special effects and quests.
 * Events are time-limited and themed.
 */
export const SEASONAL_EVENTS = [
  {
    name: "Festival de las Cerezas 🌸",
    period: "March-April",
    effect: "Double XP in #floral channels",
    quest: "Collect 100 sakura petals",
  },
  {
    name: "Torneo Interdimensional 🌀",
    period: "July",
    effect: "+30% damage in PvP battles",
    quest: "Defeat 10 opponents",
  },
  {
    name: "Noche de los Shinigamis ☠️",
    period: "October",
    effect: "Unlock dark abilities",
    quest: "Solve 5 mysteries",
  },
];

/**
 * Collectible anime cards.
 * Each card has a character, rarity, effect, and a quote.
 */
export const ANIME_CARDS = [
  {
    id: "SS01",
    character: "Naruto Uzumaki",
    rarity: "Legendary",
    effect: "+15% XP for 1 hour",
    quote: "I'm the next Hokage, believe it!",
  },
  {
    id: "SS02",
    character: "Goku",
    rarity: "Epic",
    effect: "Auto-complete 1 quest",
    quote: "Kamehameha!",
  },
];

/**
 * Special rewards for daily streaks and level milestones.
 * Includes unique items and animations.
 */
export const SPECIAL_REWARDS = {
  /**
   * Rewards for maintaining a daily activity streak.
   */
  DAILY_STREAK: [
    { days: 3, reward: "🎁 Mystery Box", animation: "✨" },
    { days: 7, reward: "💎 Power Gem", animation: "💥" },
  ],
  /**
   * Rewards for reaching specific level milestones.
   */
  LEVEL_MILESTONES: {
    10: "🏮 Celestial Lantern",
    50: "🗡️ Legendary Sword",
    100: "👑 Crown of the Gods",
  },
};

/**
 * Virtual background music tracks.
 * Each track provides a mood or bonus effect.
 */
export const BGM_TRACKS = [
  { name: "Classic Opening", mood: "Nostalgia +10%" },
  { name: "Epic Battle", mood: "XP +5% in battles" },
  { name: "Floating City", mood: "Chat speed +20%" },
];
