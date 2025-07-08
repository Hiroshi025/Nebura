import { GuildChannel, Message } from "discord.js";

// 📜 Sistema de Rangos Anime v1.0
export const ANIME_THEMES = {
  SHONEN: '¡Plus Ultra!',
  SHOJO: 'Princesa Mágica',
  ISEKAI: 'Reencarnado en otro mundo',
  MECHA: 'Piloto de Mechas',
  SPORTS: 'Campeón del Deporte'
};

export const DAILY_QUESTS = [
  {
    id: 'daily_training',
    name: '¡Entrenamiento Diario!',
    description: 'Envía 15 mensajes (¡El esfuerzo supera al talento!)',
    requirement: 15,
    xpReward: 150,
    check: (_: Message, p: number) => p + 1,
    animation: '⚡💪'
  },
  {
    id: 'heroic_rescue',
    name: '¡Rescate Heroico!',
    description: 'Ayuda a 3 usuarios en #ayuda (¡Protege a los débiles!)',
    requirement: 3,
    xpReward: 300,
    check: (m: Message, p: number) => 
      (m.channel as GuildChannel).name === 'ayuda' && m.content.includes('?') ? p + 1 : p,
    animation: '🛡️🙌'
  },
  {
    id: 'power_of_friendship',
    name: '¡Poder de la Amistad!',
    description: 'Menciona a 5 amigos diferentes',
    requirement: 5,
    xpReward: 200,
    check: (m: Message, p: number) => 
      m.mentions.users.size >= 1 ? p + 1 : p,
    animation: '✨👥'
  }
];

export const WEEKLY_QUESTS = [
  {
    id: 'tournament_arc',
    name: '¡Arco Torneo!',
    description: 'Consigue 5000 XP esta semana (¡Demuestra tu fuerza!)',
    requirement: 5000,
    xpReward: 1500,
    animation: '🏆🔥'
  },
  {
    id: 'secret_technique',
    name: '¡Técnica Secreta!',
    description: 'Alcanza nivel 15 (¡Domina tu poder oculto!)',
    requirement: 15,
    xpReward: 1000,
    animation: '🌀💥'
  }
];

export const ACHIEVEMENTS = [
  {
    id: 'protagonist',
    name: '¡Eres el Protagonista!',
    type: 'LEVEL',
    requirement: 1,
    description: 'Envía tu primer mensaje épico',
    cutscene: '¡La aventura comienza! 🌅'
  },
  {
    id: 'bankai',
    name: '¡Bankai Desbloqueado!',
    type: 'LEVEL',
    requirement: 10,
    description: 'Alcanza el nivel 10',
    cutscene: '¡Poder espiritual liberado! ⚔️💢'
  },
  {
    id: 'nakama',
    name: '¡Nakama Power!',
    type: 'SOCIAL',
    requirement: 50,
    description: 'Consigue 50 amigos',
    cutscene: '¡El verdadero poder está en los amigos! 👫🌈'
  },
  {
    id: 'hokage',
    name: '¡Sueño del Hokage!',
    type: 'PRESTIGE',
    requirement: 3,
    description: 'Alcanza Prestigio 3',
    cutscene: '¡Todo el pueblo cree en ti! 🍥🌪️'
  }
];

export const MAX_LEVEL = 100;
export const SPAM_PENALTY_XP = 100;

// 🎌 Sistema de Títulos Anime
export const ANIME_RANKS = [
  { level: 0, title: 'Civil 🎒', emoji: '👶' },
  { level: 5, title: 'Aprendiz Ninja �', emoji: '🎋' },
  { level: 10, title: 'Genin 🌱', emoji: '🍃' },
  { level: 20, title: 'Chūnin ⚔️', emoji: '🌙' },
  { level: 30, title: 'Jōnin 🐺', emoji: '🌀' },
  { level: 50, title: 'Kage 🗻', emoji: '🌋' },
  { level: 75, title: 'Héroe S 🌟', emoji: '✨' },
  { level: 100, title: 'Dios Shinigami ☯️', emoji: '⚛️' }
];

// 🎭 Historias Interactivas
export const ANIME_STORIES = {
  BEGINNER: [
    "Un día normal en la Academia... hasta que apareció el Lord Demonio! 😈",
    "El maestro te entrega tu primera misión: ¡Hablar con 5 personas! 🗣️"
  ],
  INTERMEDIATE: [
    "¡Aparece un enemigo de nivel B! Derrota 3 spammers para proteger el servidor! 💥",
    "Descubres un artefacto legendario: ¡El Emoji del Poder! 🔥"
  ],
  ADVANCED: [
    "¡Guerra de clanes! Únete a un estudio para ganar habilidades especiales 🏯",
    "¡Alerta de jefe final! Todos vs el Spammer Overlord nivel 100! 👹"
  ]
};

// 🎞️ Sistema de Estudios (Guildas Anime)
export const ANIME_STUDIOS = [
  {
    name: 'Studio Pierrot 🌙',
    bonus: 'XP +10% en misiones nocturnas',
    requirement: 'Nivel 20+'
  },
  {
    name: 'Ufotable 🔥',
    bonus: 'Efectos visuales épicos en logros',
    requirement: 'Prestigio 1+'
  },
  {
    name: 'Kyoto Animation 🎆',
    bonus: 'Doble progresión en historias',
    requirement: '50+ amigos'
  }
];

// 🌸 Eventos Estacionales
export const SEASONAL_EVENTS = [
  {
    name: 'Festival de las Cerezas 🌸',
    period: 'Marzo-Abril',
    effect: 'XP Doble en canales #floral',
    quest: 'Colecciona 100 pétalos de sakura'
  },
  {
    name: 'Torneo Interdimensional 🌀',
    period: 'Julio',
    effect: '+30% daño en batallas PvP',
    quest: 'Derrota a 10 oponentes'
  },
  {
    name: 'Noche de los Shinigamis ☠️',
    period: 'Octubre',
    effect: 'Desbloquea habilidades oscuras',
    quest: 'Resuelve 5 misterios'
  }
];

// 🎴 Sistema de Cartas Coleccionables
export const ANIME_CARDS = [
  {
    id: 'SS01',
    character: 'Naruto Uzumaki',
    rarity: 'Legendaria',
    effect: '+15% XP por 1 hora',
    quote: '¡Soy el próximo Hokage, believe it!'
  },
  {
    id: 'SS02',
    character: 'Goku',
    rarity: 'Épica',
    effect: 'Auto-completa 1 misión',
    quote: '¡Kamehameha!'
  }
];

// 🎉 Recompensas Especiales
export const SPECIAL_REWARDS = {
  DAILY_STREAK: [
    { days: 3, reward: '🎁 Caja Misteriosa', animation: '✨' },
    { days: 7, reward: '💎 Gema del Poder', animation: '💥' }
  ],
  LEVEL_MILESTONES: {
    10: '🏮 Linterna Celestial',
    50: '🗡️ Espada Legendaria',
    100: '👑 Corona de los Dioses'
  }
};

// 🎵 Banda Sonora Virtual
export const BGM_TRACKS = [
  { name: 'Opening Clásico', mood: 'Nostalgia +10%' },
  { name: 'Batalla Épica', mood: 'XP +5% en combates' },
  { name: 'Ciudad Flotante', mood: 'Velocidad de chat +20%' }
];