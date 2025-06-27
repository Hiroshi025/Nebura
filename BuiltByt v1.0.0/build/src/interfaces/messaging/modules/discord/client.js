"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="1a99d59f-99b7-57b6-8114-0e665f6c399f")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyClient = void 0;
const discord_js_1 = require("discord.js");
const distube_1 = __importDefault(require("distube"));
const main_1 = require("../../../../main");
const error_extend_1 = require("../../../../shared/adapters/extends/error.extend");
const config_1 = require("../../../../shared/utils/config");
const console_1 = require("../../../../shared/utils/functions/console");
const emojis_json_1 = __importDefault(require("../../../../../config/json/emojis.json"));
const giveaway_1 = require("./structure/giveaway");
const collection_1 = require("./structure/handlers/collection");
const youtube_1 = require("./structure/handlers/youtube");
/**
 * Represents the main Discord client for the application.
 * Extends the `Client` class from `discord.js` to provide additional functionality.
 */
class MyClient extends discord_js_1.Client {
    /**
     * Configuration for the Discord module.
     * Loaded from the application's configuration file.
     */
    settings;
    /**
     * Instance of the `DiscordHandler` class, responsible for managing Discord-related operations.
     */
    handlers;
    /**
     * A collection that holds categories, where the key is a string identifier
     * (e.g., category name) and the value is an array of strings representing
     * the items in that category.
     *
     * @type {Collection<string, string[]>}
     */
    categories = new discord_js_1.Collection();
    /**
     * A collection of commands, where the key is the command name and the value
     * is the command object (typically an instance of a Command class).
     *
     * @type {Collection<string, Command>}
     */
    commands = new discord_js_1.Collection();
    /**
     * A collection of buttons, where the key is a string identifier for the button
     * (e.g., button name) and the value is the button object.
     *
     * @type {Collection<string, Buttons>}
     */
    buttons = new discord_js_1.Collection();
    /**
     * A collection of modals, where the key is a string identifier for the modal
     * and the value is the modal object.
     *
     * @type {Collection<string, Modals>}
     */
    modals = new discord_js_1.Collection();
    /**
     * A collection of menus, where the key is a string identifier for the menu
     * and the value is the menu object.
     *
     * @type {Collection<string, Menus>}
     */
    menus = new discord_js_1.Collection();
    /**
     * A collection of addons, where the key is a string identifier for the addon
     * and the value is the addon object.
     *
     * @type {Collection<unknown, unknown>}
     */
    addons;
    /**
     * Collection of preloaded commands.
     *
     * @type {Collection<string, unknown>}
     * @public
     */
    precommands;
    /**
     * Collection of command aliases.
     *
     * @type {Collection<string, string>}
     * @public
     */
    aliases;
    /**
     * Collection of modals.
     *
     * @type {Collection<string, unknown>}
     * @public
     */
    voiceGenerator;
    /**
     * Collection of cooldowns for commands or interactions.
     *
     * @type {Collection<unknown, unknown>}
     * @public
     */
    cooldown;
    /**
     * Collection of job members count.
     *
     * @type {Collection<unknown, unknown>}
     * @public
     */
    Jobmembercount;
    distube;
    Youtubelog;
    /**
     * Initializes a new instance of the `MyClient` class.
     * Configures the client with specific intents and partials, and initializes handlers and settings.
     */
    constructor() {
        super({
            makeCache: discord_js_1.Options.cacheWithLimits({
                ...discord_js_1.Options.DefaultMakeCacheSettings,
                AutoModerationRuleManager: 0,
            }),
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMembers,
                discord_js_1.GatewayIntentBits.GuildIntegrations,
                discord_js_1.GatewayIntentBits.GuildWebhooks,
                discord_js_1.GatewayIntentBits.GuildInvites,
                discord_js_1.GatewayIntentBits.GuildVoiceStates,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.DirectMessages,
                discord_js_1.GatewayIntentBits.AutoModerationConfiguration,
                discord_js_1.GatewayIntentBits.DirectMessagePolls,
                discord_js_1.GatewayIntentBits.GuildIntegrations,
                discord_js_1.GatewayIntentBits.GuildScheduledEvents,
                discord_js_1.GatewayIntentBits.DirectMessageTyping,
                discord_js_1.GatewayIntentBits.GuildExpressions,
                discord_js_1.GatewayIntentBits.GuildMessageReactions,
                discord_js_1.GatewayIntentBits.DirectMessageReactions,
            ],
            partials: [
                discord_js_1.Partials.GuildMember,
                discord_js_1.Partials.Message,
                discord_js_1.Partials.User,
                discord_js_1.Partials.Channel,
                discord_js_1.Partials.ThreadMember,
                discord_js_1.Partials.GuildScheduledEvent,
                discord_js_1.Partials.Reaction,
            ],
            sweepers: {
                ...discord_js_1.Options.DefaultSweeperSettings,
                users: {
                    interval: 1_800, // Every hour.
                    filter: () => (user) => user.bot && user.id !== user.client.user.id, // Remove all bots.
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
                        // Remove thread members that are not in the guild.
                        const guild = this.guilds.cache.get(this.settings.guildId);
                        if (!threadMember.user)
                            return false; // If the user is not defined, do not remove.
                        return !guild?.members.cache.has(threadMember.user.id);
                    },
                },
                autoModerationRules: {
                    interval: 1_800, // Every 30 minutes.
                    filter: () => (rule) => {
                        // Remove auto moderation rules that are not in the guild.
                        const guild = this.guilds.cache.get(this.settings.guildId);
                        return !guild?.autoModerationRules.cache.has(rule.id);
                    },
                },
            },
        });
        this.distube = new distube_1.default(this, {
            emitNewSongOnly: true,
            //leaveOnFinish: true,
            emitAddSongWhenCreatingQueue: false,
            emitAddListWhenCreatingQueue: false,
            plugins: [],
        });
        this.handlers = new collection_1.DiscordHandler(this);
        this.settings = config_1.config.modules.discord;
        this.cooldown = new discord_js_1.Collection();
        this.categories = new discord_js_1.Collection();
        this.commands = new discord_js_1.Collection();
        this.buttons = new discord_js_1.Collection();
        this.voiceGenerator = new discord_js_1.Collection();
        this.precommands = new discord_js_1.Collection();
        this.aliases = new discord_js_1.Collection();
        this.modals = new discord_js_1.Collection();
        this.addons = new discord_js_1.Collection();
        this.menus = new discord_js_1.Collection();
        this.on("ready", async () => {
            const data = await main_1.main.DB.findDiscord(this.user?.id);
            if (!data || !this.user || !data.activity)
                return;
            this.user.setUsername(data.username);
            this.user.setAvatar(data.avatar);
            let activityName;
            if (typeof data.activity === "object" && data.activity !== null && "name" in data.activity) {
                activityName = data.activity.name;
            }
            else if (typeof data.activity === "string") {
                activityName = data.activity;
            }
            if (activityName) {
                this.user.setActivity({
                    name: activityName,
                    url: data.activity.url,
                    state: data.activity.status,
                });
            }
        });
    }
    /**
     * Starts the Discord client and the application.
     *
     * - Logs the startup process.
     * - Validates the presence of a token in the configuration.
     * - Logs into Discord using the provided token.
     * - Loads and deploys the handlers.
     *
     * @returns {Promise<void>} Resolves when the client has successfully started or exits early if an error occurs.
     */
    async start() {
        (0, console_1.logWithLabel)("debug", "Starting Discord API...");
        const { TOKEN_DISCORD } = process.env;
        // Check if the token is provided in the configuration
        if (!TOKEN_DISCORD) {
            (0, console_1.logWithLabel)("info", [
                "APP Discord API Error:",
                `  ${emojis_json_1.default.circle_x}  No token provided`,
                `  ${emojis_json_1.default.circle_x}  Please provide a token in the config file`,
            ].join("\n"));
            return;
        }
        /**
         * Log in to Discord using the provided token.
         * The token is expected to be a string that authenticates the client with the Discord API.
         * This method is asynchronous and returns a promise that resolves when the login is successful.
         */
        await this.login(TOKEN_DISCORD);
        (0, console_1.logWithLabel)("debug", [
            "APP Discord API Started:",
            `  ${emojis_json_1.default.circle_check}  Logged in as ${this.user?.tag} (${this.user?.id})`,
            `  ${emojis_json_1.default.circle_check}  Latency: ${this.ws.ping}ms`,
        ].join("\n"));
        // Load and deploy the handlers
        await this.handlers.loadAll();
        await new giveaway_1.GiveawayService();
        await (0, youtube_1.YouTube)(this);
        try {
            await Promise.all([this.handlers.deployCommands()]);
        }
        catch (err) {
            console.error(err);
            throw new error_extend_1.DiscordError("Error loading handlers");
        }
    }
    /**
     * Obtiene un emoji por su nombre, priorizando los emojis del servidor.
     *
     * @param guildId - El ID del servidor donde buscar el emoji.
     * @param emojiName - El nombre del emoji a buscar.
     * @returns {string} El emoji encontrado o el emoji del archivo JSON si no está en el servidor.
     */
    getEmoji(guildId, emojiName) {
        const guild = this.guilds.cache.get(guildId);
        if (guild) {
            const emoji = guild.emojis.cache.find((e) => e.name === emojiName);
            if (emoji)
                return `<:${emoji.name}:${emoji.id}>`;
        }
        // Si no se encuentra en el servidor, usar el emoji del archivo JSON
        return typeof emojis_json_1.default[emojiName] === "string" ? emojis_json_1.default[emojiName] : `:${emojiName}:`;
    }
}
exports.MyClient = MyClient;
//# sourceMappingURL=client.js.map
//# debugId=1a99d59f-99b7-57b6-8114-0e665f6c399f
