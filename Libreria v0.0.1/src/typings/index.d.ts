export interface Gemini {
  version: string;
  model: string;
}

export type StatType = "health" | "attack" | "defense" | "speed" | "mana";

export interface CharacterStats {
  health: number;
  attack: number;
  defense: number;
  speed: number;
  mana: number;
}

export interface CharacterData {
  config: config;
  id: string;
  name: string;
  level: number;
  experience: number;
  stats: CharacterStats;
  skills: Skill[];
  items: Item[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: (caster: Character, target: Character) => string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: "health" | "mana" | "stat";
  value: number;
  statAffected?: StatType;
}

export interface config {
  prefix: string;
  initialStats: {
    health: number;
    attack: number;
    defense: number;
    speed: number;
    mana: number;
  };
  levelUpMultiplier: number;
}
