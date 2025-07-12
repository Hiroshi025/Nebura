import { Client, Collection, GatewayIntentBits, Options, Partials } from "discord.js";

import { main } from "@/main";
import i18next from "@/shared/i18n";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";
import { Buttons, Menus, Modals } from "@typings/modules/discord";
import { DiscordError } from "@utils/extends/error.extension";

//import { GiveawayService } from "./structure/giveaway";
import { DiscordHandler } from "./structure/handlers/collection";
import { YouTube } from "./structure/handlers/youtube";
import { Command } from "./structure/utils/builders";

/**
 * Main Discord client class for the application.
 * Extends the Discord.js Client, adding custom collections and handlers for commands, buttons, modals, menus, and more.
 * Handles initialization, configuration, and startup logic for the Discord bot.
 */
export class MyDiscord extends Client {
  /**
   * Discord module configuration loaded from the application's config file.
   * Used for accessing settings such as the guild ID and other Discord-specific options.
   */
  private settings: typeof config.modules.discord;

  /**
   * Instance of DiscordHandler, responsible for loading, managing, and deploying Discord-related handlers (commands, events, etc.).
   */
  public handlers: DiscordHandler;

  /**
   * Collection of command categories.
   * Key: category name (string), Value: array of command names (string[]).
   * Used to organize commands into logical groups.
   */
  public categories: Collection<string, string[]> = new Collection();

  /**
   * Collection of all registered commands.
   * Key: command name (string), Value: Command instance.
   */
  public commands: Collection<string, Command> = new Collection();

  /**
   * Collection of all registered button interactions.
   * Key: button identifier (string), Value: Buttons instance.
   */
  public buttons: Collection<string, Buttons> = new Collection();

  /**
   * Collection of all registered modal interactions.
   * Key: modal identifier (string), Value: Modals instance.
   */
  public modals: Collection<string, Modals> = new Collection();

  /**
   * Collection of all registered menu interactions.
   * Key: menu identifier (string), Value: Menus instance.
   */
  public menus: Collection<string, Menus> = new Collection();

  /**
   * Collection of loaded addons or plugins.
   * Key and value types are unknown, allowing for flexible extension.
   */
  public addons: Collection<unknown, unknown>;

  /**
   * Collection of preloaded commands, used for command registration before full initialization.
   * Key: command name (string), Value: unknown (can be any precommand structure).
   */
  public precommands: Collection<string, unknown>;

  /**
   * Collection of command aliases for quick command lookup.
   * Key: alias (string), Value: original command name (string).
   */
  public aliases: Collection<string, string>;

  /**
   * Collection for voice generator features or modules.
   * Key and value types are unknown, allowing for flexible extension.
   */
  public voiceGenerator: Collection<unknown, unknown>;

  /**
   * Collection for tracking cooldowns for commands or interactions.
   * Used to prevent command spam and enforce rate limits.
   * Key and value types are unknown.
   */
  public cooldown: Collection<unknown, unknown>;

  /**
   * Collection or object for tracking the number of members in jobs or tasks.
   * The type is any, as its structure may vary.
   */
  public Jobmembercount: any;

  /**
   * Logging or tracking object for YouTube-related actions or events.
   * The type is any, as its structure may vary.
   */
  Youtubelog: any;

  /**
   * Instance of i18next or similar translation library, used for internationalization and localization.
   */
  translations: any;

  //giveaways: GiveawayService;

  /**
   * Constructs a new MyDiscord client instance.
   * Sets up Discord.js client options, initializes all collections, handlers, and music features.
   * Also sets up event listeners for client readiness and activity status.
   */
  constructor() {
    super({
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        AutoModerationRuleManager: 0,
      }),
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.DirectMessagePolls,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
      ],
      partials: [
        Partials.GuildMember,
        Partials.Message,
        Partials.User,
        Partials.Channel,
        Partials.ThreadMember,
        Partials.GuildScheduledEvent,
        Partials.Reaction,
      ],
      allowedMentions: {
        parse: ["users", "roles"],
        users: [],
        roles: [],
      },
      waitGuildTimeout: 10_000, // 10 seconds
      closeTimeout: 10_000, // 10 seconds
      sweepers: {
        ...Options.DefaultSweeperSettings,
        users: {
          interval: 1_800, // Every hour.
          filter: () => (user) => user.bot && user.id !== user.client.user.id, // Remove all bots except self.
        },
        threads: {
          interval: 1_800, // Every 30 minutes.
          lifetime: 86_400, // Remove threads older than 24 hours.
        },
        stickers: {
          interval: 1_800, // Every 30 minutes.
          filter: () => (sticker) => sticker.guildId !== this.settings.guildId,
        },
        threadMembers: {
          interval: 1_800, // Every 30 minutes.
          filter: () => (threadMember) => {
            // Remove thread members that are not in the configured guild.
            const guild = this.guilds.cache.get(this.settings.guildId);
            if (!threadMember.user) return false; // If the user is not defined, do not remove.
            return !guild?.members.cache.has(threadMember.user.id);
          },
        },
        autoModerationRules: {
          interval: 1_800, // Every 30 minutes.
          filter: () => (rule) => {
            // Remove auto moderation rules that are not in the configured guild.
            const guild = this.guilds.cache.get(this.settings.guildId);
            return !guild?.autoModerationRules.cache.has(rule.id);
          },
        },
      },
    });

    //this.giveaways = new GiveawayService(this);
    this.handlers = new DiscordHandler(this);
    this.settings = config.modules.discord;
    this.cooldown = new Collection();
    this.translations = i18next;

    this.categories = new Collection();
    this.commands = new Collection();
    this.buttons = new Collection();

    this.voiceGenerator = new Collection();
    this.precommands = new Collection();
    this.aliases = new Collection();

    this.modals = new Collection();
    this.addons = new Collection();
    this.menus = new Collection();

    /**
     * Event listener for the 'ready' event.
     * Sets the bot's username, avatar, and activity based on database values when the client is ready.
     */
    this.on("ready", async () => {
      const data = await main.DB.findDiscord(this.user?.id as string);
      if (!data || !this.user || !data.activity) return;
      let activityName: string | undefined;
      if (typeof data.activity === "object" && data.activity !== null && "name" in data.activity) {
        activityName = (data.activity as { name: string }).name;
      } else if (typeof data.activity === "string") {
        activityName = data.activity;
      }
      if (activityName) {
        this.user.setActivity({
          name: activityName,
          url: (data.activity as { url: string }).url,
          state: (data.activity as { status: string }).status,
        });
      }

      if (this.user.verified === true) return;
      this.user.setUsername(data.username);
      this.user.setAvatar(data.avatar);
    });
  }

  /**
   * Starts the Discord client and application logic.
   * - Logs the startup process.
   * - Validates the presence of a Discord token in the environment.
   * - Logs into Discord using the provided token.
   * - Loads and deploys all handlers and commands.
   * @returns {Promise<void>} Resolves when the client has successfully started, or exits early if an error occurs.
   * @throws {DiscordError} If there is an error loading handlers.
   */
  public async start(): Promise<void> {
    logWithLabel("debug", "Starting Discord API...");
    const { TOKEN_DISCORD } = process.env;

    // Check if the token is provided in the configuration
    if (!TOKEN_DISCORD) {
      logWithLabel(
        "info",
        [
          "APP Discord API Error:",
          `  ${emojis.circle_x}  No token provided`,
          `  ${emojis.circle_x}  Please provide a token in the config file`,
        ].join("\n"),
      );
      return;
    }

    /**
     * Log in to Discord using the provided token.
     * The token is expected to be a string that authenticates the client with the Discord API.
     * This method is asynchronous and returns a promise that resolves when the login is successful.
     */
    console.debug(`[DEBUG][Discord] Logging in with token... ${TOKEN_DISCORD}`);
    await this.login(TOKEN_DISCORD);
    logWithLabel(
      "debug",
      [
        "APP Discord API Started:",
        `  ${emojis.circle_check}  Logged in as ${this.user?.tag} (${this.user?.id})`,
        `  ${emojis.circle_check}  Latency: ${this.ws.ping}ms`,
      ].join("\n"),
    );

    // Load and deploy the handlers
    await this.handlers.loadAll();
    await YouTube(this);
    try {
      await Promise.all([this.handlers.deployCommands()]);
    } catch (err) {
      console.error(err);
      throw new DiscordError("Error loading handlers");
    }
  }

  /**
   * Retrieves an emoji by its name, prioritizing server (guild) emojis.
   * If the emoji is not found in the guild, falls back to the emoji defined in the emojis JSON file.
   * @param guildId - The ID of the guild (server) to search for the emoji.
   * @param emojiName - The name of the emoji to search for (must be a key of the emojis JSON).
   * @returns {string} The formatted emoji string for Discord, or the fallback emoji from the JSON file.
   */
  public getEmoji(guildId: string, emojiName: keyof typeof emojis): string {
    const guild = this.guilds.cache.get(guildId);
    if (guild) {
      const emoji = guild.emojis.cache.find((e) => e.name === emojiName);
      if (emoji) return `<:${emoji.name}:${emoji.id}>`;
    }
    return typeof emojis[emojiName] === "string" ? emojis[emojiName] : `:${emojiName}:`;
  }

  /**
   * Traduce una clave usando i18next, detectando el idioma del usuario o servidor.
   * @param key Clave de traducción (namespace:clave)
   * @param options Opciones de i18next, incluyendo variables y el idioma
   * @param lang Idioma forzado (opcional)
   */
  public t(key: string, options?: any, lang?: string): string {
    return this.translations.t(key, { lng: lang || options?.lng, ...options });
  }
}
