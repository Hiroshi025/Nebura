import { Collection, EmbedBuilder } from "discord.js";

import { General } from "../../infra/general";
import { CharacterData, CharacterStats, Item, Skill, StatType } from "../../typings/index";

class Character extends General {
  public id: string;
  public name: string;
  public level: number;
  public experience: number;
  public stats: CharacterStats;
  public skills: Skill[];
  public items: Item[];
  public maxStats!: CharacterStats;

  constructor(data: CharacterData) {
    super(data.config); // Llamar al constructor de la clase base con el parámetro config

    this.id = data.id;
    this.name = data.name;
    this.level = data.level || 1;
    this.experience = data.experience || 0;
    this.stats = { ...this.config.initialStats, ...data.stats }; // Usar this.config heredado
    this.skills = data.skills || [];
    this.items = data.items || [];
    this.calculateMaxStats();
  }

  private calculateMaxStats(): void {
    this.maxStats = {
      health: this.stats.health,
      mana: this.stats.mana,
      attack: this.stats.attack,
      defense: this.stats.defense,
      speed: this.stats.speed,
    };
  }

  public addExperience(amount: number): string {
    this.experience += amount;
    const neededExp = this.getRequiredExp();
    let levelUpMessage = "";

    if (this.experience >= neededExp) {
      this.levelUp();
      levelUpMessage = `\n¡${this.name} ha subido al nivel ${this.level}!`;
    }

    return `${this.name} ha ganado ${amount} puntos de experiencia.${levelUpMessage}`;
  }

  private getRequiredExp(): number {
    return this.level * 100;
  }

  private levelUp(): void {
    this.level++;
    this.experience = 0;

    // Mejorar estadísticas
    (Object.keys(this.stats) as StatType[]).forEach((stat) => {
      this.stats[stat] = Math.floor(
        this.stats[stat] * this.config.levelUpMultiplier
      ); // Usar this.config heredado
    });

    this.calculateMaxStats();
  }

  public useItem(itemId: string): string {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return "¡No tienes ese objeto!";

    let message = `${this.name} usó ${item.name}. `;

    switch (item.type) {
      case "health":
        this.stats.health = Math.min(
          this.maxStats.health,
          this.stats.health + item.value
        );
        message += `Recuperó ${item.value} puntos de salud.`;
        break;
      case "mana":
        this.stats.mana = Math.min(
          this.maxStats.mana,
          this.stats.mana + item.value
        );
        message += `Recuperó ${item.value} puntos de mana.`;
        break;
      case "stat":
        if (item.statAffected) {
          this.stats[item.statAffected] += item.value;
          message += `Aumentó ${item.statAffected} en ${item.value}.`;
        }
        break;
    }

    // Eliminar el objeto después de usarlo
    this.items = this.items.filter((i) => i.id !== itemId);

    return message;
  }

  public useSkill(skillId: string, target: Character): string {
    const skill = this.skills.find((s) => s.id === skillId);
    if (!skill) return "¡No conoces esa habilidad!";
    if (this.stats.mana < skill.cost) return "¡No tienes suficiente mana!";

    this.stats.mana -= skill.cost;
    return skill.effect(this, target);
  }

  public attack(target: Character): string {
    const damage = Math.max(
      1,
      this.stats.attack - Math.floor(target.stats.defense / 2)
    );
    target.stats.health -= damage;

    return `${this.name} atacó a ${target.name} y le causó ${damage} puntos de daño.`;
  }

  public isAlive(): boolean {
    return this.stats.health > 0;
  }

  public toData(): CharacterData {
    return {
      config: this.config,
      id: this.id,
      name: this.name,
      level: this.level,
      experience: this.experience,
      stats: this.stats,
      skills: this.skills,
      items: this.items,
    };
  }
}

class Battle {
  public player: Character;
  public enemy: Character;
  public turn: number;
  public isPlayerTurn: boolean;
  public battleLog: string[];

  constructor(player: Character, enemy: Character) {
    this.player = player;
    this.enemy = enemy;
    this.turn = 1;
    this.isPlayerTurn = this.determineFirstTurn();
    this.battleLog = [];
  }

  private determineFirstTurn(): boolean {
    // El personaje con mayor velocidad ataca primero
    return this.player.stats.speed >= this.enemy.stats.speed;
  }

  public processTurn(
    action: "attack" | "skill" | "item",
    skillOrItemId?: string
  ): string {
    let result = `\n**Turno ${this.turn}**\n`;

    // Acción del jugador o enemigo según turno
    if (this.isPlayerTurn) {
      result += this.processPlayerAction(action, skillOrItemId);
    } else {
      result += this.processEnemyAction();
    }

    // Verificar si la batalla ha terminado
    if (!this.player.isAlive()) {
      result += `\n**${this.player.name} ha sido derrotado!**`;
      this.battleLog.push(result);
      return result;
    }

    if (!this.enemy.isAlive()) {
      const expGained = this.enemy.level * 20;
      result += `\n**${this.enemy.name} ha sido derrotado!**`;
      result += `\n${this.player.addExperience(expGained)}`;
      this.battleLog.push(result);
      return result;
    }

    // Cambiar turno si ambos siguen vivos
    this.isPlayerTurn = !this.isPlayerTurn;
    if (!this.isPlayerTurn) this.turn++;

    this.battleLog.push(result);
    return result;
  }

  private processPlayerAction(
    action: "attack" | "skill" | "item",
    skillOrItemId?: string
  ): string {
    let result = "";

    switch (action) {
      case "attack":
        result += this.player.attack(this.enemy);
        break;
      case "skill":
        if (!skillOrItemId) return "¡Debes especificar una habilidad!";
        result += this.player.useSkill(skillOrItemId, this.enemy);
        break;
      case "item":
        if (!skillOrItemId) return "¡Debes especificar un objeto!";
        result += this.player.useItem(skillOrItemId);
        break;
    }

    return result;
  }

  private processEnemyAction(): string {
    // IA simple: 70% ataque normal, 20% habilidad, 10% objeto
    const random = Math.random();

    if (random < 0.7 || this.enemy.skills.length === 0) {
      return this.enemy.attack(this.player);
    } else if (random < 0.9) {
      // Usar una habilidad aleatoria
      const randomSkill =
        this.enemy.skills[Math.floor(Math.random() * this.enemy.skills.length)];
      return this.enemy.useSkill(randomSkill.id, this.player);
    } else {
      // Usar un objeto aleatorio si tiene
      if (this.enemy.items.length > 0) {
        const randomItem =
          this.enemy.items[Math.floor(Math.random() * this.enemy.items.length)];
        return this.enemy.useItem(randomItem.id);
      } else {
        return this.enemy.attack(this.player);
      }
    }
  }

  public getBattleStatus(): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(`Batalla: ${this.player.name} vs ${this.enemy.name}`)
      .setColor("#FF0000")
      .addFields(
        {
          name: this.player.name,
          value: `❤️ Salud: ${this.player.stats.health}/${this.player.maxStats.health}\n✨ Mana: ${this.player.stats.mana}/${this.player.maxStats.mana}\n⚔️ Nivel: ${this.player.level}`,
          inline: true,
        },
        {
          name: this.enemy.name,
          value: `❤️ Salud: ${this.enemy.stats.health}/${this.enemy.maxStats.health}\n✨ Mana: ${this.enemy.stats.mana}/${this.enemy.maxStats.mana}\n⚔️ Nivel: ${this.enemy.level}`,
          inline: true,
        },
        {
          name: "Turno",
          value: this.isPlayerTurn
            ? `Es tu turno (Turno ${this.turn})`
            : `Turno del enemigo (Turno ${this.turn})`,
          inline: false,
        }
      );

    return embed;
  }
}

export class BattleNet {
  private activeBattles: Collection<string, Battle>;

  constructor() {
    this.activeBattles = new Collection();
  }

  public startBattle(player: Character, enemy: Character): Battle {
    const battle = new Battle(player, enemy);
    this.activeBattles.set(player.id, battle);
    return battle;
  }

  public endBattle(playerId: string): void {
    this.activeBattles.delete(playerId);
  }

  public getBattle(playerId: string): Battle | undefined {
    return this.activeBattles.get(playerId);
  }

  public hasActiveBattle(playerId: string): boolean {
    return this.activeBattles.has(playerId);
  }
}
