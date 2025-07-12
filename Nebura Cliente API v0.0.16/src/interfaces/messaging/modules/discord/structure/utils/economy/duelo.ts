import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType,
	ChatInputCommandInteraction, MessageFlags, StringSelectMenuBuilder, StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder, TextChannel, User
} from "discord.js";

import { main } from "@/main";
import { EmbedCorrect, ErrorEmbed } from "@shared/utils/extends/discord/embeds.extends";

import { MyDiscord } from "../../../client";
import { fetchBalance } from "../functions";

// Tipos y constantes para las nuevas mecánicas
type BattleTerrain = "forest" | "mountain" | "volcano" | "plains" | "desert" | "graveyard";
type CharacterClass = "warrior" | "mage" | "assassin" | "archer" | "cleric";

interface TerrainEffect {
  name: string;
  description: string;
  background: string;
  modifiers: {
    evasion?: number;
    defense?: number;
    fireDamage?: number;
    criticalChance?: number;
    missChance?: number;
    undeadBonus?: boolean;
  };
  specialEvent?: string;
}

interface ClassAbilities {
  name: string;
  description: string;
  passive?: string;
  special: {
    name: string;
    description: string;
    effect: (duelSettings: any, isChallenger: boolean) => void;
    cooldown: number;
  };
}

const TERRAINS: Record<BattleTerrain, TerrainEffect> = {
  forest: {
    name: "Enchanted Forest",
    description: "A dense forest full of mysteries and hidden creatures.",
    background: "🌳 The trees whisper ancient secrets...",
    modifiers: {
      evasion: 15,
      missChance: 5,
    },
    specialEvent: "A gust of wind deflects some attacks!",
  },
  mountain: {
    name: "Steep Mountains",
    description: "Rocky and dangerous terrain with deadly cliffs.",
    background: "⛰️ The thin air makes movement difficult...",
    modifiers: {
      defense: 20,
      evasion: -5,
    },
    specialEvent: "Rocks fall randomly, affecting both combatants!",
  },
  volcano: {
    name: "Erupting Volcano",
    description: "An extreme environment with lava and toxic smoke.",
    background: "🌋 The intense heat and gases affect the battle...",
    modifiers: {
      fireDamage: 30,
      defense: -10,
    },
    specialEvent: "Lava explosions cause random damage!",
  },
  plains: {
    name: "Open Plains",
    description: "Neutral terrain with no special modifiers.",
    background: "🌾 The wind gently blows over the grass...",
    modifiers: {},
  },
  desert: {
    name: "Burning Desert",
    description: "A sea of sand with occasional storms.",
    background: "🏜️ The sand and heat exhaust the combatants...",
    modifiers: {
      missChance: 10,
      fireDamage: 15,
    },
    specialEvent: "Sandstorms reduce visibility!",
  },
  graveyard: {
    name: "Cursed Graveyard",
    description: "Land of the undead with dark energy.",
    background: "⚰️ The restless souls affect the battlefield...",
    modifiers: {
      undeadBonus: true,
      criticalChance: 5,
    },
    specialEvent: "Spirits interfere with the attacks!",
  },
};

const CLASSES: Record<CharacterClass, ClassAbilities> = {
  warrior: {
    name: "Warrior",
    description: "Specialist in melee combat with high resistance.",
    passive: "10% damage reduction",
    special: {
      name: "Critical Strike",
      description: "Attack with a 30% chance to deal double damage",
      effect: (duelSettings, isChallenger) => {
        const status = isChallenger ? duelSettings.challengerStatus : duelSettings.opponentStatus;
        status.attackBoost *= 1.5;
        status.specialActive = true;
        status.specialTurns = 2;
      },
      cooldown: 4,
    },
  },
  mage: {
    name: "Mage",
    description: "Master of arcane arts with powerful spells.",
    passive: "Spells charge 20% faster",
    special: {
      name: "Magic Shield",
      description: "Absorbs 50% of the damage received for 2 turns",
      effect: (duelSettings, isChallenger) => {
        const status = isChallenger ? duelSettings.challengerStatus : duelSettings.opponentStatus;
        status.defense += 50;
        status.specialActive = true;
        status.specialTurns = 2;
      },
      cooldown: 3,
    },
  },
  assassin: {
    name: "Assassin",
    description: "Master of stealth and precise attacks.",
    passive: "10% chance to evade attacks",
    special: {
      name: "Surprise Attack",
      description: "Ignores opponent's defense and has 25% critical chance",
      effect: (duelSettings, isChallenger) => {
        const status = isChallenger ? duelSettings.challengerStatus : duelSettings.opponentStatus;
        status.hidden = true;
        status.attackBoost *= 1.8;
        status.specialActive = true;
        status.specialTurns = 1;
      },
      cooldown: 5,
    },
  },
  archer: {
    name: "Archer",
    description: "Expert marksman with great long-range accuracy.",
    passive: "5% additional critical hit chance",
    special: {
      name: "Arrow Rain",
      description: "Multiple attacks that partially ignore defense",
      effect: (duelSettings, isChallenger) => {
        const status = isChallenger ? duelSettings.challengerStatus : duelSettings.opponentStatus;
        status.attackBoost *= 1.3;
        status.ignoreDefense = true;
        status.specialActive = true;
        status.specialTurns = 1;
      },
      cooldown: 3,
    },
  },
  cleric: {
    name: "Cleric",
    description: "Healer and protector with divine blessings.",
    passive: "Regenerates 2% HP each turn",
    special: {
      name: "Divine Healing",
      description: "Restores 30% of max HP and cleanses negative effects",
      effect: (duelSettings, isChallenger) => {
        const status = isChallenger ? duelSettings.challengerStatus : duelSettings.opponentStatus;
        const hp = isChallenger ? duelSettings.challengerHP : duelSettings.opponentHP;
        const healAmount = Math.floor(duelSettings.BASE_HP * 0.3);

        if (isChallenger) {
          duelSettings.challengerHP = Math.min(duelSettings.BASE_HP, hp + healAmount);
        } else {
          duelSettings.opponentHP = Math.min(duelSettings.BASE_HP, hp + healAmount);
        }

        status.cursed = false;
        status.specialActive = true;
        status.specialTurns = 0;
      },
      cooldown: 6,
    },
  },
};

export async function DueloCommand(interaction: ChatInputCommandInteraction, _client: MyDiscord) {
  if (!interaction.guild || !interaction.channel) return;

  const challenger = interaction.user;
  const opponent = interaction.options.getUser("user");
  const bet = interaction.options.getNumber("bet");

  if (!opponent || opponent.bot || opponent.id === challenger.id) {
    return interaction.reply({
      embeds: [new ErrorEmbed().setDescription("You must mention a valid user to challenge to a duel.")],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!bet || bet < 500) {
    return interaction.reply({
      embeds: [new ErrorEmbed().setDescription("The minimum bet for a duel is $500.")],
      flags: MessageFlags.Ephemeral,
    });
  }

  const challengerBalance = await fetchBalance(challenger.id, interaction.guild.id);
  const opponentBalance = await fetchBalance(opponent.id, interaction.guild.id);

  if (challengerBalance.balance < bet || opponentBalance.balance < bet) {
    return interaction.reply({
      embeds: [new ErrorEmbed().setDescription("Both users must have enough balance to cover the bet.")],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Paso 1: Selección de terreno por el retador
  const terrainSelect = new StringSelectMenuBuilder()
    .setCustomId("terrain_select")
    .setPlaceholder("Select a battle terrain")
    .addOptions(
      Object.entries(TERRAINS).map(([key, terrain]) =>
        new StringSelectMenuOptionBuilder().setLabel(terrain.name).setDescription(terrain.description).setValue(key),
      ),
    );

  const terrainRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(terrainSelect);

  const terrainMessage = await interaction.reply({
    content: `${challenger}, select the terrain for the duel:`,
    components: [terrainRow],
    flags: "Ephemeral",
  });

  let selectedTerrain: BattleTerrain = "plains"; // Valor por defecto

  try {
    const terrainResponse = (await terrainMessage.awaitMessageComponent({
      filter: (i) => i.user.id === challenger.id && i.customId === "terrain_select",
      time: 30000,
    })) as StringSelectMenuInteraction;

    selectedTerrain = terrainResponse.values[0] as BattleTerrain;
    await terrainResponse.update({
      content: `Terreno seleccionado: ${TERRAINS[selectedTerrain].name}`,
      components: [],
    });
  } catch (error) {
    await interaction.editReply({
      content: "Time's up, using default terrain: Open Plains",
      components: [],
    });
  }

  // Paso 2: Selección de clase por cada jugador
  const classSelect = new StringSelectMenuBuilder()
    .setCustomId("class_select")
    .setPlaceholder("Select your class")
    .addOptions(
      Object.entries(CLASSES).map(([key, cls]) =>
        new StringSelectMenuOptionBuilder().setLabel(cls.name).setDescription(cls.description).setValue(key),
      ),
    );

  const classRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(classSelect);

  const challengerClassMsg = await interaction.followUp({
    content: `${challenger}, select your class:`,
    components: [classRow],
    flags: "Ephemeral",
  });

  let challengerClass: CharacterClass = "warrior";

  try {
    const classResponse = (await challengerClassMsg.awaitMessageComponent({
      filter: (i) => i.user.id === challenger.id && i.customId === "class_select",
      time: 30000,
    })) as StringSelectMenuInteraction;

    challengerClass = classResponse.values[0] as CharacterClass;
    await classResponse.update({
      content: `Clase seleccionada: ${CLASSES[challengerClass].name}`,
      components: [],
    });
  } catch (error) {
    await challengerClassMsg.edit({
      content: "Time's up, using default class: Warrior",
      components: [],
    });
  }

  const opponentClassMsg = await interaction.followUp({
    content: `${opponent}, select your class:`,
    components: [classRow],
    flags: "Ephemeral",
  });

  let opponentClass: CharacterClass = "warrior";

  try {
    const classResponse = (await opponentClassMsg.awaitMessageComponent({
      filter: (i) => i.user.id === opponent.id && i.customId === "class_select",
      time: 30000,
    })) as StringSelectMenuInteraction;

    opponentClass = classResponse.values[0] as CharacterClass;
    await classResponse.update({
      content: `Clase seleccionada: ${CLASSES[opponentClass].name}`,
      components: [],
    });
  } catch (error) {
    await opponentClassMsg.edit({
      content: "Time's up, using default class: Warrior",
      components: [],
    });
  }

  // Configuración del duelo con las nuevas mecánicas
  const BASE_HP = 2500;
  const duelSettings = {
    BASE_HP,
    terrain: selectedTerrain,
    terrainEffects: TERRAINS[selectedTerrain],
    challengerHP: BASE_HP,
    opponentHP: BASE_HP,
    challengerMoney: challengerBalance.balance,
    opponentMoney: opponentBalance.balance,
    currentTurn: challenger,
    turnCounter: 0,
    challengerClass,
    opponentClass,
    challengerStatus: {
      class: challengerClass,
      defense: 0,
      hidden: false,
      attackBoost: 1,
      originalAttackBoost: 1,
      cursed: false,
      curseTurns: 0,
      divine: false,
      divineTurns: 0,
      specialCharge: 0,
      specialCooldown: 0,
      specialActive: false,
      specialTurns: 0,
      ignoreDefense: false,
      counterAttackChance: 0,
      turnModifier: 0,
      regeneration: 0,
    },
    opponentStatus: {
      class: opponentClass,
      defense: 0,
      hidden: false,
      attackBoost: 1,
      originalAttackBoost: 1,
      cursed: false,
      curseTurns: 0,
      divine: false,
      divineTurns: 0,
      specialCharge: 0,
      specialCooldown: 0,
      specialActive: false,
      specialTurns: 0,
      ignoreDefense: false,
      counterAttackChance: 0,
      turnModifier: 0,
      regeneration: 0,
    },
    duelActive: true,
    lastInteraction: null as ButtonInteraction<CacheType> | null,
    lastActionTime: null as number | null,
    duelStory: [
      `🏰 **Epic duel begins!** ${challenger.username} (${CLASSES[challengerClass].name}) challenges ${opponent.username} (${CLASSES[opponentClass].name}) for $${bet}`,
      `🌍 **Terrain:** ${TERRAINS[selectedTerrain].name}`,
      TERRAINS[selectedTerrain].background,
      "⚔️ The combatants prepare for battle...",
    ],
    sacrificeTarget: null as User | null,
    sacrificeActive: false,
  };

  // Aplicar efectos pasivos de clase
  applyClassPassives(duelSettings);

  // Función para aplicar efectos pasivos de clase
  function applyClassPassives(settings: typeof duelSettings) {
    // Retador
    //const challengerClass = CLASSES[settings.challengerClass];
    //const opponentClass = CLASSES[settings.opponentClass];

    // Efectos pasivos del retador
    if (settings.challengerClass === "cleric") {
      settings.challengerStatus.regeneration = 2;
    }

    if (settings.challengerClass === "assassin") {
      settings.challengerStatus.counterAttackChance = 10;
    }

    if (settings.challengerClass === "archer") {
      settings.challengerStatus.counterAttackChance = 5;
    }

    // Efectos pasivos del oponente
    if (settings.opponentClass === "cleric") {
      settings.opponentStatus.regeneration = 2;
    }

    if (settings.opponentClass === "assassin") {
      settings.opponentStatus.counterAttackChance = 10;
    }

    if (settings.opponentClass === "archer") {
      settings.opponentStatus.counterAttackChance = 5;
    }
  }

  // Función para mostrar las barras de vida
  const getHealthBar = (hp: number, isDivine = false) => {
    const totalBars = 20;
    if (isDivine) return "∞ " + "✨".repeat(totalBars) + " (Divine)";

    const filledBars = Math.round((hp / BASE_HP) * totalBars);
    return "❤️ " + "🟥".repeat(filledBars) + "⬛".repeat(totalBars - filledBars) + ` ${hp}/${BASE_HP}`;
  };

  // Función para añadir historia al duelo
  const addToStory = (message: string) => {
    duelSettings.duelStory.push(message);
    if (duelSettings.duelStory.length > 10) {
      duelSettings.duelStory.shift();
    }
  };

  const getVisibleStory = () => duelSettings.duelStory.slice(-10).join("\n");

  // Función para calcular daño con todas las modificaciones
  const calculateDamage = (baseDamage: number, attackerStatus: any, defenderStatus: any, isStrongAttack = false) => {
    let damage = baseDamage;

    // Modificador de ataque
    damage *= attackerStatus.attackBoost;

    // Modificador de terreno
    if (isStrongAttack && duelSettings.terrain === "volcano") {
      damage *= 1.3; // 30% más de daño en volcán
    }

    // Modificador de clase
    if (attackerStatus.class === "warrior" && isStrongAttack) {
      damage *= 1.2; // 20% más de daño para guerreros en ataques fuertes
    }

    // Modificador de defensa (a menos que se ignore)
    if (!attackerStatus.ignoreDefense) {
      damage *= 1 - defenderStatus.defense / 100;
    }

    // Efecto de terreno en defensa
    if (duelSettings.terrain === "mountain") {
      damage *= 0.9; // 10% menos daño en montañas
    }

    // Efecto de evasión (bosque)
    if (duelSettings.terrain === "forest" && Math.random() * 100 < 15) {
      damage *= 0.5; // 50% de daño si se activa la evasión
      addToStory(TERRAINS.forest.specialEvent!);
    }

    return Math.max(10, Math.floor(damage));
  };

  // Función para verificar críticos y fallos
  const checkCriticalOrMiss = (attackerStatus: any) => {
    let isCritical = false;
    let isMiss = false;

    // Probabilidad base
    let criticalChance = 10 + (attackerStatus.class === "archer" ? 5 : 0);
    let missChance = 5 + (attackerStatus.cursed ? 50 : 0);

    // Modificador de terreno
    if (duelSettings.terrain === "graveyard") {
      criticalChance += 5;
    }

    if (duelSettings.terrain === "desert") {
      missChance += 10;
    }

    // Verificar crítico
    if (Math.random() * 100 < criticalChance) {
      isCritical = true;
    }

    // Verificar fallo (no puede ser crítico y fallo a la vez)
    if (!isCritical && Math.random() * 100 < missChance) {
      isMiss = true;
    }

    return { isCritical, isMiss };
  };

  // Función para manejar contraataques
  const handleCounterAttack = (defenderStatus: any, damageReceived: number) => {
    if (Math.random() * 100 < defenderStatus.counterAttackChance) {
      const counterDamage = Math.floor(damageReceived * 0.5);
      addToStory(`⚡ ¡Contraataque! Devuelve ${counterDamage} de daño.`);
      return counterDamage;
    }
    return 0;
  };

  // Función para manejar modificadores de turno
  const handleTurnModifiers = (playerStatus: any) => {
    if (playerStatus.turnModifier > 0) {
      playerStatus.turnModifier--;
      return true; // Indica que el jugador tiene otro turno
    }
    return false;
  };

  // Componentes de los botones
  const createActionRows = () => {
    const isChallengerTurn = duelSettings.currentTurn.id === challenger.id;
    const playerStatus = isChallengerTurn ? duelSettings.challengerStatus : duelSettings.opponentStatus;
    const hasEnoughForSacrifice = isChallengerTurn
      ? duelSettings.challengerMoney >= 1000
      : duelSettings.opponentMoney >= 1000;

    const buttons = [
      new ButtonBuilder().setCustomId("basic_attack").setLabel("Basic Attack ⚔️").setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("strong_attack")
        .setLabel("Strong Attack 🔥 ($200)")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(isChallengerTurn ? duelSettings.challengerMoney < 200 : duelSettings.opponentMoney < 200),
      new ButtonBuilder().setCustomId("defend").setLabel("Defend 🛡️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("class_ability")
        .setLabel(
          `${CLASSES[playerStatus.class].special.name} (${playerStatus.specialCooldown > 0 ? `CD: ${playerStatus.specialCooldown}` : "Ready"})`,
        )
        .setStyle(ButtonStyle.Success)
        .setDisabled(playerStatus.specialCooldown > 0),
      new ButtonBuilder()
        .setCustomId("sacrifice")
        .setLabel("Sacrifice Ritual ☠️ ($1000)")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasEnoughForSacrifice || duelSettings.sacrificeActive),
      new ButtonBuilder().setCustomId("meteor_strike").setLabel("Meteor Strike ☄️").setStyle(ButtonStyle.Danger),
    ];

    // Dividir botones en filas de máximo 5
    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
    }
    return rows;
  };

  // Función para actualizar el mensaje del duelo
  const updateDuelMessage = async () => {
    if (!duelSettings.lastInteraction) return;

    const challengerDivine = duelSettings.challengerStatus.divine;
    const opponentDivine = duelSettings.opponentStatus.divine;

    const embed = new EmbedCorrect()
      .setTitle("⚔️ Duel in Progress")
      .setDescription(
        `🌍 **Terreno:** ${duelSettings.terrainEffects.name}\n` +
          `📜 **Duel Story:**\n${getVisibleStory()}\n\n` +
          `**Current Turn:** ${duelSettings.currentTurn.username} (Turn ${duelSettings.turnCounter})\n\n` +
          `### 🤺 ${challenger.username} [${CLASSES[duelSettings.challengerClass].name}]\n` +
          `${getHealthBar(duelSettings.challengerHP, challengerDivine)}\n` +
          `🛡️ Defense: ${duelSettings.challengerStatus.defense}% | ` +
          `💥 Attack: x${duelSettings.challengerStatus.attackBoost}` +
          `${duelSettings.challengerStatus.cursed ? ` | ☠️ Cursed (${duelSettings.challengerStatus.curseTurns}t)` : ""}` +
          `${challengerDivine ? ` | ✨ Divine (${duelSettings.challengerStatus.divineTurns}t)` : ""}` +
          `${duelSettings.challengerStatus.regeneration > 0 ? ` | 🌿 Regen: ${duelSettings.challengerStatus.regeneration}%` : ""}\n\n` +
          `### 🛡️ ${opponent.username} [${CLASSES[duelSettings.opponentClass].name}]\n` +
          `${getHealthBar(duelSettings.opponentHP, opponentDivine)}\n` +
          `🛡️ Defense: ${duelSettings.opponentStatus.defense}% | ` +
          `💥 Attack: x${duelSettings.opponentStatus.attackBoost}` +
          `${duelSettings.opponentStatus.cursed ? ` | ☠️ Cursed (${duelSettings.opponentStatus.curseTurns}t)` : ""}` +
          `${opponentDivine ? ` | ✨ Divine (${duelSettings.opponentStatus.divineTurns}t)` : ""}` +
          `${duelSettings.opponentStatus.regeneration > 0 ? ` | 🌿 Regen: ${duelSettings.opponentStatus.regeneration}%` : ""}`,
      )
      .setColor("Orange")
      .setFooter({ text: "You have 2 minutes per turn" });

    try {
      await duelSettings.lastInteraction.editReply({
        embeds: [embed],
        components: createActionRows(),
      });
    } catch (error) {
      console.error("Error updating duel message:", error);
    }
  };

  // Función para manejar el sacrificio
  const handleSacrifice = async (sacrificer: User, target: User) => {
    duelSettings.sacrificeActive = true;
    addToStory(`☠️ ${sacrificer.username} started a sacrifice ritual on ${target.username}!`);

    // Enviar mensaje al objetivo
    try {
      const dmChannel = await target.createDM();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("stop_sacrifice").setLabel("STOP SACRIFICE").setStyle(ButtonStyle.Danger),
      );

      const message = await dmChannel.send({
        content:
          `⚠️ You have been chosen as a sacrifice in a duel between ${challenger.username} and ${opponent.username}!\n` +
          `You have 2 minutes to stop this ritual or your economy will be ruined!`,
        components: [row],
      });

      const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === target.id && i.customId === "stop_sacrifice",
        time: 120000,
      });

      collector.on("collect", async (i) => {
        await i.update({
          content: "The sacrifice ritual has been stopped!",
          components: [],
        });
        duelSettings.sacrificeActive = false;
        addToStory(`✨ ${target.username} resisted the sacrifice ritual!`);
        collector.stop();
      });

      collector.on("end", async (_, reason) => {
        if (reason === "time") {
          // Aplicar consecuencias del sacrificio
          const targetEconomy = await fetchBalance(target.id, interaction.guild!.id);
          await main.prisma.userEconomy.update({
            where: { id: targetEconomy.id },
            data: { balance: -100000000000 },
          });

          // Dar beneficios al sacrificador
          const sacrificerStatus =
            sacrificer.id === challenger.id ? duelSettings.challengerStatus : duelSettings.opponentStatus;

          sacrificerStatus.divine = true;
          sacrificerStatus.divineTurns = 2;
          if (sacrificerStatus.divine) {
            sacrificerStatus.originalAttackBoost = sacrificerStatus.attackBoost; // Guardar el valor original
            sacrificerStatus.attackBoost *= 10;
          }

          addToStory(`💀 ${target.username} has been sacrificed! ${sacrificer.username} becomes divine for 2 turns!`);

          try {
            await dmChannel.send({
              content: "⛔ The sacrifice ritual was completed! Your balance has been ruined!",
            });
          } catch (e) {
            console.error("Couldn't send DM:", e);
          }
        }
        duelSettings.sacrificeActive = false;
      });
    } catch (error) {
      console.error("Couldn't send sacrifice DM:", error);
      duelSettings.sacrificeActive = false;
      addToStory(`❌ The sacrifice ritual on ${target.username} failed!`);
      await sacrificer.send("❌ Your sacrifice ritual failed due to an error.");
    }
  };

  // Mensaje inicial del duelo
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("accept_duel").setLabel("Accept Duel").setStyle(ButtonStyle.Success),
  );

  const duelMessage = await interaction.followUp({
    embeds: [
      new EmbedCorrect()
        .setTitle("⚔️ Duel Challenge")
        .setDescription(
          `${opponent}, you have been challenged to a duel by ${challenger}!\n\n` +
            `**Bet Amount:** $${bet}\n` +
            `**Terrain:** ${duelSettings.terrainEffects.name}\n` +
            `**Classes:**\n` +
            `- ${challenger.username}: ${CLASSES[challengerClass].name}\n` +
            `- ${opponent.username}: ${CLASSES[opponentClass].name}\n\n` +
            `You have **10 seconds** to accept the challenge.`,
        )
        .setColor("Orange")
        .setFooter({ text: "React quickly to accept the duel!" }),
    ],
    components: [row],
    fetchReply: true,
  });

  const collector = duelMessage.createMessageComponentCollector({
    filter: (i) => i.user.id === opponent.id && i.customId === "accept_duel",
    time: 10000,
  });

  collector.on("collect", async (i) => {
    try {
      await i.deferUpdate();
      collector.stop();
      if (i.isButton()) {
        duelSettings.lastInteraction = i;
      }

      // Colector principal del duelo
      const duelCollector = (i.channel as TextChannel).createMessageComponentCollector({
        filter: (btn) =>
          [challenger.id, opponent.id].includes(btn.user.id) &&
          ["basic_attack", "strong_attack", "defend", "class_ability", "sacrifice", "meteor_strike"].includes(
            btn.customId,
          ),
        time: 120000,
        idle: 120000,
      });

      duelCollector?.on("collect", async (btn) => {
        if (!duelSettings.duelActive || btn.user.id !== duelSettings.currentTurn.id) {
          return btn.deferUpdate().catch(console.error);
        }

        try {
          await btn.deferUpdate();
          if (btn.isButton()) {
            duelSettings.lastInteraction = btn;
          }
          duelSettings.lastActionTime = Date.now();
          duelCollector.resetTimer();

          const isChallenger = btn.user.id === challenger.id;
          const playerStatus = isChallenger ? duelSettings.challengerStatus : duelSettings.opponentStatus;
          const opponentStatus = isChallenger ? duelSettings.opponentStatus : duelSettings.challengerStatus;

          let actionMessage = "";
          let attackMissed = false;
          let isCritical = false;

          // Manejar regeneración de HP
          if (playerStatus.regeneration > 0) {
            const healAmount = Math.floor(duelSettings.BASE_HP * (playerStatus.regeneration / 100));
            if (isChallenger) {
              duelSettings.challengerHP = Math.min(duelSettings.BASE_HP, duelSettings.challengerHP + healAmount);
            } else {
              duelSettings.opponentHP = Math.min(duelSettings.BASE_HP, duelSettings.opponentHP + healAmount);
            }
            addToStory(`🌿 ${btn.user.username} regeneró ${healAmount} HP!`);
          }

          // Verificar si el jugador tiene turno extra
          const hasExtraTurn = handleTurnModifiers(playerStatus);

          switch (btn.customId) {
            case "basic_attack":
              // Verificar crítico o fallo
              const { isCritical: crit, isMiss: miss } = checkCriticalOrMiss(playerStatus);
              isCritical = crit;
              attackMissed = miss;

              if (attackMissed) {
                actionMessage = `❌ ${btn.user.username} tried to attack but missed!`;
                addToStory(`💨 ${btn.user.username} swung at air!`);
              } else {
                let baseDamage = Math.floor(Math.random() * 100 + 50);

                // Aplicar crítico
                if (isCritical) {
                  baseDamage *= 2;
                  addToStory(`💫 ${btn.user.username} landed a critical hit!`);
                }

                const finalDamage = calculateDamage(baseDamage, playerStatus, opponentStatus);

                if (isChallenger) {
                  duelSettings.opponentHP -= finalDamage;
                } else {
                  duelSettings.challengerHP -= finalDamage;
                }
                actionMessage = `⚔️ ${btn.user.username} attacked dealing ${finalDamage} damage${isCritical ? " (CRITICAL)" : ""}!`;
                addToStory(`💥 ${btn.user.username} landed a solid hit!`);

                // Manejar contraataque
                const counterDamage = handleCounterAttack(opponentStatus, finalDamage);
                if (counterDamage > 0) {
                  if (isChallenger) {
                    duelSettings.challengerHP -= counterDamage;
                  } else {
                    duelSettings.opponentHP -= counterDamage;
                  }
                }

                // Cargar magia
                playerStatus.specialCharge = Math.min(3, playerStatus.specialCharge + 1);
              }
              break;

            case "strong_attack":
              const cost = 200;
              if (
                (isChallenger && duelSettings.challengerMoney < cost) ||
                (!isChallenger && duelSettings.opponentMoney < cost)
              ) {
                actionMessage = "❌ You don't have enough money for this attack!";
                break;
              }

              // Verificar crítico o fallo
              const { isCritical: strongCrit, isMiss: strongMiss } = checkCriticalOrMiss(playerStatus);
              isCritical = strongCrit;
              attackMissed = strongMiss;

              if (attackMissed) {
                if (isChallenger) {
                  duelSettings.challengerMoney -= cost;
                } else {
                  duelSettings.opponentMoney -= cost;
                }
                actionMessage = `❌ ${btn.user.username} tried a strong attack but missed! (-$${cost})`;
                addToStory(`💸 ${btn.user.username} wasted $${cost} on a missed attack!`);
              } else {
                if (isChallenger) {
                  duelSettings.challengerMoney -= cost;
                } else {
                  duelSettings.opponentMoney -= cost;
                }

                let strongDamage = Math.floor(Math.random() * 200 + 100);

                // Aplicar crítico
                if (isCritical) {
                  strongDamage *= 2;
                  addToStory(`💫 ${btn.user.username} landed a powerful critical hit!`);
                }

                const finalStrongDamage = calculateDamage(strongDamage, playerStatus, opponentStatus, true);

                if (isChallenger) {
                  duelSettings.opponentHP -= finalStrongDamage;
                } else {
                  duelSettings.challengerHP -= finalStrongDamage;
                }
                actionMessage = `🔥 ${btn.user.username} used strong attack dealing ${finalStrongDamage} damage${isCritical ? " (CRITICAL)" : ""}! (-$${cost})`;
                addToStory(`🔥 ${btn.user.username} unleashed a powerful attack!`);

                // Manejar contraataque
                const counterDamage = handleCounterAttack(opponentStatus, finalStrongDamage);
                if (counterDamage > 0) {
                  if (isChallenger) {
                    duelSettings.challengerHP -= counterDamage;
                  } else {
                    duelSettings.opponentHP -= counterDamage;
                  }
                }

                // Cargar magia más rápido
                playerStatus.specialCharge = Math.min(3, playerStatus.specialCharge + 2);
              }
              break;

            case "defend":
              playerStatus.defense = Math.min(80, playerStatus.defense + 30);
              playerStatus.hidden = false;

              // Bonus adicional para guerreros
              if (playerStatus.class === "warrior") {
                playerStatus.defense = Math.min(90, playerStatus.defense + 10);
              }

              actionMessage = `🛡️ ${btn.user.username} defended!`;
              addToStory(`🛡️ ${btn.user.username} took a defensive stance!`);
              break;

            case "class_ability":
              if (playerStatus.specialCooldown > 0) {
                actionMessage = "❌ Your class ability is still on cooldown!";
                break;
              }

              // Ejecutar habilidad especial de clase
              const classAbility = CLASSES[playerStatus.class].special;
              classAbility.effect(duelSettings, isChallenger);

              // Configurar enfriamiento
              playerStatus.specialCooldown = classAbility.cooldown;

              actionMessage = `✨ ${btn.user.username} used ${classAbility.name}!`;
              addToStory(`🌟 ${btn.user.username} activated their class ability: ${classAbility.name}!`);
              break;

            case "sacrifice":
              const sacrificeCost = 1000;
              if (
                (isChallenger && duelSettings.challengerMoney < sacrificeCost) ||
                (!isChallenger && duelSettings.opponentMoney < sacrificeCost)
              ) {
                actionMessage = "❌ You don't have enough money for the sacrifice ritual!";
                break;
              }

              if (duelSettings.sacrificeActive) {
                actionMessage = "❌ There's already an active sacrifice ritual!";
                break;
              }

              // Pedir objetivo del sacrificio
              actionMessage = "🔮 Mention a user to sacrifice in the next 30 seconds!";
              await btn.followUp({
                content: actionMessage,
                flags: MessageFlags.SuppressEmbeds,
              });

              const filter = (m: { author: { id: string }; mentions: { users: { size: number } } }) =>
                m.author.id === btn.user.id && m.mentions.users.size > 0;

              try {
                const collected = await (i.channel as TextChannel).awaitMessages({
                  filter,
                  max: 1,
                  time: 30000,
                  errors: ["time"],
                });

                const target = collected.first()?.mentions.users.first();
                if (!target || target.bot || target.id === btn.user.id) {
                  actionMessage = "❌ Invalid target for the sacrifice ritual!";
                  break;
                }
                if (target) {
                  if (isChallenger) {
                    duelSettings.challengerMoney -= sacrificeCost;
                  } else {
                    duelSettings.opponentMoney -= sacrificeCost;
                  }

                  duelSettings.sacrificeTarget = target;
                  handleSacrifice(btn.user, target);
                  actionMessage = `☠️ ${btn.user.username} started a sacrifice ritual on ${target.username}!`;
                  addToStory(`💀 ${btn.user.username} began a dark ritual targeting ${target.username}!`);
                }
              } catch {
                actionMessage = "❌ No valid target mentioned for sacrifice!";
              }
              break;

            case "meteor_strike":
              const meteorDamageToSelf = Math.floor(Math.random() * 300 + 100);
              const meteorDamageToOpponent = Math.floor(Math.random() * 300 + 100);

              if (isChallenger) {
                duelSettings.challengerHP -= meteorDamageToSelf;
                duelSettings.opponentHP -= meteorDamageToOpponent;
              } else {
                duelSettings.opponentHP -= meteorDamageToSelf;
                duelSettings.challengerHP -= meteorDamageToOpponent;
              }

              actionMessage = `☄️ ${btn.user.username} invoked a Meteor Strike! It dealt ${meteorDamageToOpponent} damage to the opponent but also ${meteorDamageToSelf} damage to themselves!`;
              addToStory(
                `☄️ A meteor crashes down! ${btn.user.username} takes ${meteorDamageToSelf} damage, while ${isChallenger ? opponent.username : challenger.username} takes ${meteorDamageToOpponent} damage!`,
              );
              break;
          }

          // Reducir efectos con el tiempo
          if (!playerStatus.divine) {
            playerStatus.defense = Math.max(0, playerStatus.defense - 10);
            playerStatus.attackBoost = Math.max(1, playerStatus.attackBoost - 0.2);
          }

          // Reducir cooldown de habilidad especial
          if (playerStatus.specialCooldown > 0) {
            playerStatus.specialCooldown--;
          }

          // Manejar estados especiales
          if (duelSettings.challengerStatus.cursed) {
            duelSettings.challengerStatus.curseTurns--;
            if (duelSettings.challengerStatus.curseTurns <= 0) {
              duelSettings.challengerStatus.cursed = false;
              addToStory(`✨ The curse on ${challenger.username} has lifted!`);
            }
          }
          if (duelSettings.opponentStatus.cursed) {
            duelSettings.opponentStatus.curseTurns--;
            if (duelSettings.opponentStatus.curseTurns <= 0) {
              duelSettings.opponentStatus.cursed = false;
              addToStory(`✨ The curse on ${opponent.username} has lifted!`);
            }
          }

          // Manejar divinidad
          if (duelSettings.challengerStatus.divine) {
            duelSettings.challengerStatus.divineTurns--;
            if (duelSettings.challengerStatus.divineTurns <= 0) {
              duelSettings.challengerStatus.divine = false;
              duelSettings.challengerStatus.attackBoost = duelSettings.challengerStatus.originalAttackBoost || 1;
              addToStory(`☁️ ${challenger.username}'s divine power fades!`);
            }
          }
          if (duelSettings.opponentStatus.divine) {
            duelSettings.opponentStatus.divineTurns--;
            if (duelSettings.opponentStatus.divineTurns <= 0) {
              duelSettings.opponentStatus.divine = false;
              duelSettings.opponentStatus.attackBoost /= 10;
              addToStory(`☁️ ${opponent.username}'s divine power fades!`);
            }
          }

          // Manejar habilidad especial activa
          if (playerStatus.specialActive) {
            playerStatus.specialTurns--;
            if (playerStatus.specialTurns <= 0) {
              playerStatus.specialActive = false;
              // Restaurar valores normales según la habilidad
              if (playerStatus.class === "assassin") {
                playerStatus.hidden = false;
                playerStatus.attackBoost /= 1.8;
              } else if (playerStatus.class === "archer") {
                playerStatus.ignoreDefense = false;
                playerStatus.attackBoost /= 1.3;
              } else if (playerStatus.class === "warrior") {
                playerStatus.attackBoost /= 1.5;
              } else if (playerStatus.class === "mage") {
                playerStatus.defense -= 50;
              }
              addToStory(`✨ ${btn.user.username}'s class ability effect ended.`);
            }
          }

          // Verificar si el duelo ha terminado
          if (duelSettings.challengerHP <= 0 || duelSettings.opponentHP <= 0) {
            duelSettings.duelActive = false;
            duelCollector.stop();

            const winner = duelSettings.challengerHP > 0 ? challenger : opponent;
            const loser = duelSettings.challengerHP > 0 ? opponent : challenger;
            const totalBet = bet * 2;

            // Actualizar balances
            const loserEconomy = await main.prisma.userEconomy.findUnique({
              where: { id: `${loser.id}_${interaction.guild!.id}` },
            });

            await Promise.all([
              main.prisma.userEconomy.update({
                where: {
                  userId_guildId: `${winner.id}-${interaction.guild!.id}`,
                },
                data: {
                  balance: { increment: totalBet },
                  wonduels: { increment: 1 },
                },
              }),
              main.prisma.userEconomy.update({
                where: {
                  userId_guildId: `${loser.id}-${interaction.guild!.id}`,
                },
                data: {
                  lostduels: { set: (loserEconomy?.lostduels || 0) + 1 },
                },
              }),
            ]);

            addToStory(`🏆 **${winner.username} wins the duel!** Wins $${totalBet}`);

            return i.followUp({
              embeds: [
                new EmbedCorrect()
                  .setTitle("🏆 Duel Finished")
                  .setDescription(
                    `📜 **Duel Story:**\n${duelSettings.duelStory.join("\n")}\n\n` +
                      `**Winner:** ${winner.username} (${CLASSES[winner.id === challenger.id ? challengerClass : opponentClass].name})\n` +
                      `**Loser:** ${loser.username} (${CLASSES[loser.id === challenger.id ? challengerClass : opponentClass].name})\n` +
                      `**Terrain:** ${duelSettings.terrainEffects.name}\n` +
                      `**Prize:** $${totalBet}\n\n` +
                      `**Final HP:**\n` +
                      `${challenger.username}: ${Math.max(0, duelSettings.challengerHP)}/${BASE_HP}\n` +
                      `${opponent.username}: ${Math.max(0, duelSettings.opponentHP)}/${BASE_HP}`,
                  )
                  .setColor("Green"),
              ],
              components: [],
            });
          }

          // Cambiar turno (a menos que tenga turno extra)
          if (!hasExtraTurn) {
            duelSettings.currentTurn = duelSettings.currentTurn.id === challenger.id ? opponent : challenger;
          } else {
            addToStory(`⏳ ${btn.user.username} gets another turn!`);
          }

          duelSettings.turnCounter++;

          // Enviar mensaje de acción
          if (actionMessage) {
            await btn.followUp({
              content: actionMessage,
              flags: MessageFlags.SuppressEmbeds,
            });
          }

          await updateDuelMessage();
        } catch (error) {
          console.error("Error processing duel action:", error);
        }
      });

      duelCollector?.on("end", async (_, reason) => {
        if (!duelSettings.duelActive) return;

        duelSettings.duelActive = false;
        if (reason === "time" || reason === "idle") {
          addToStory("💥 The duel ended due to inactivity! Both players lose!");

          await i.followUp({
            embeds: [
              new EmbedCorrect()
                .setTitle("💥 Duel Finished")
                .setDescription(
                  `📜 **Duel Story:**\n${duelSettings.duelStory.join("\n")}\n\n` +
                    "The duel ended due to inactivity. Both players lose!",
                )
                .setColor("Red"),
            ],
            components: [],
          });
        }
      });

      await updateDuelMessage();
    } catch (error) {
      console.error("Error accepting duel:", error);
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason === "time") {
      await interaction.editReply({
        content: "The duel was canceled because it was not accepted in time.",
        components: [],
      });
    }
  });

  return;
}
