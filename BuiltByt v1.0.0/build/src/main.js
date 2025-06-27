"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="7a03948d-2d98-58ab-b0e6-879139fe2bc0")}catch(e){}}();

/**
 * Main entry point for the Nebura Application Platform client.
 *
 * This file initializes and manages the core modules of the application,
 * including Discord, WhatsApp, API, and database operations.
 *
 * @packageDocumentation
 * @module Main
 * @see {@link https://www.prisma.io/ | Prisma}
 * @see {@link https://www.npmjs.com/package/chalk | Chalk}
 * @see {@link https://docs.sentry.io/platforms/node/ | Sentry}
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = exports.GiveawayManager = exports.client = exports.Engine = void 0;
const chalk_1 = __importDefault(require("chalk"));
const error_extend_1 = require("./shared/adapters/extends/error.extend"); // Custom error handling class
const utils_1 = require("./shared/class/utils");
const emojis_json_1 = __importDefault(require("../config/json/emojis.json"));
const giveaway_1 = require("./interfaces/messaging/modules/discord/structure/giveaway");
const client_1 = require("@prisma/client"); // Prisma ORM client: https://www.prisma.io/
const reminders_1 = require("./shared/utils/functions/reminders"); // Function to load pending reminders
const _1 = require("./");
const client_2 = require("./interfaces/messaging/modules/discord/client"); // Custom Discord client implementation
const errors_1 = require("./interfaces/messaging/modules/discord/structure/handlers/errors"); // Error handling for Discord
const whatsapp_1 = require("./interfaces/messaging/modules/whatsapp"); // WhatsApp module
const backups_1 = require("./shared/class/backups");
const DB_1 = require("./shared/class/DB");
const config_1 = require("./shared/utils/config"); // Application configuration
const console_1 = require("./shared/utils/functions/console"); // Logging utility
process.loadEnvFile(); // Load environment variables from a file
/**
 * Default configuration object loaded from the config utility.
 * @type {ProyectConfig}
 */
const defaultConfig = config_1.config;
const { CRON_BACKUPS_TIME } = process.env;
/**
 * Utility for detailed debug logging using environment variables.
 *
 * @param label - The label for the debug log.
 * @param args - Additional arguments to log.
 */
function debugLog(label, ...args) {
    if (process.env.DEBUG === "true") {
        console.debug(`[DEBUG][${label}]`, ...args);
    }
}
/**
 * Main class responsible for initializing and managing the core modules of the application.
 *
 * This class serves as the entry point for the application, orchestrating the initialization
 * and management of various modules such as Discord, WhatsApp, API, and database operations.
 *
 * @remarks
 * - The class uses Prisma ORM for database interactions.
 * - Sentry is used for error monitoring and reporting.
 * - The application supports modular architecture with Discord and WhatsApp modules.
 *
 * @see {@link https://www.prisma.io/docs | Prisma Documentation}
 * @see {@link https://docs.sentry.io/platforms/node/ | Sentry Documentation}
 * @see {@link https://www.npmjs.com/package/chalk | Chalk Documentation}
 */
class Engine {
    /**
     * Prisma client instance for database operations.
     * @readonly
     */
    prisma;
    /**
     * Discord client instance.
     * @readonly
     */
    discord;
    /**
     * WhatsApp module instance.
     * @readonly
     */
    whatsapp;
    /**
     * API server instance.
     * @readonly
     */
    api;
    /**
     * Application configuration object.
     * @readonly
     */
    config;
    /**
     * Utility functions for Discord.
     * @readonly
     */
    utils;
    /**
     * Database operations instance using Prisma.
     * @readonly
     */
    DB;
    /**
     * Initializes the core module instances.
     *
     * @param prisma - Instance of PrismaClient for database operations. Defaults to a new instance.
     * @param config - Configuration object for the application. Defaults to the loaded configuration.
     * @param utils - Utility functions for Discord. Defaults to a new Utils instance.
     * @param DB - Database operations instance. Defaults to a new DBPrisma instance.
     * @param discord - Instance of the Discord client. Defaults to a new MyClient instance.
     * @param whatsapp - Instance of the WhatsApp module. Defaults to a new MyApp instance.
     * @param api - Instance of the API server. Defaults to a new API instance.
     */
    constructor(prisma = Engine.createDefaultPrismaClient(), config = defaultConfig, discord = new client_2.MyClient(), DB = new DB_1.DBPrisma(), whatsapp = new whatsapp_1.MyApp(), utils = new utils_1.Utils(), api = new _1.API()) {
        console.debug("[Engine][constructor] Initializing Engine with provided modules.");
        this.whatsapp = whatsapp;
        this.discord = discord;
        this.prisma = prisma;
        this.config = config;
        this.utils = utils;
        this.api = api;
        this.DB = DB;
    }
    /**
     * Creates a default Prisma client instance with predefined settings.
     *
     * @returns A new instance of PrismaClient.
     * @see {@link https://www.prisma.io/docs/reference/api-reference/prisma-client-reference | Prisma Client API Reference}
     */
    static createDefaultPrismaClient() {
        console.debug("[Engine][createDefaultPrismaClient] Creating default Prisma client.");
        return new client_1.PrismaClient({
            log: [
                { emit: "event", level: "query" },
                { emit: "stdout", level: "error" },
                { emit: "stdout", level: "info" },
                { emit: "stdout", level: "warn" },
            ],
            errorFormat: "colorless",
            datasources: {
                db: {
                    url: process.env.DATABASE_URL, // Database connection URL from environment variables
                },
            },
        });
    }
    /**
     * Configures application monitoring using Sentry.
     *
     * @remarks
     * Sentry is used to monitor and report errors in the application. The configuration
     * includes the DSN, environment, and debug settings.
     *
     * @see {@link https://docs.sentry.io/platforms/node/ | Sentry Node.js Documentation}
     * @returns {Promise<void>} A promise that resolves when monitoring is configured.
     */
    async configureMonitoring() {
        console.debug("[Engine][configureMonitoring] Configuring monitoring (Sentry).");
        /*     await Sentry.init({
          dsn: SENTRY_NODE_KEY,
          tracesSampleRate: 1.0,
          environment: NODE_ENV,
          debug: NODE_ENV !== "production",
        });
        logWithLabel("custom", "Sentry monitoring configured successfully.", {
          customLabel: "Monitoring",
        }); */
    }
    /**
     * Sets up the backup service with scheduled backups.
     *
     * @remarks
     * The backup service uses a cron expression to schedule backups. The cron expression
     * is retrieved from the environment variables.
     *
     * @see {@link https://www.npmjs.com/package/node-cron | Node-Cron Documentation}
     * @returns {Promise<void>} A promise that resolves when the backup service is set up.
     */
    async setupBackupService() {
        console.debug("[Engine][setupBackupService] Setting up backup service.");
        if (config_1.config.tasks.backups.enabled !== true) {
            console.debug("[Engine][setupBackupService] Backups are disabled in config.");
            return;
        }
        await new backups_1.Backups().scheduleBackups(CRON_BACKUPS_TIME);
        (0, console_1.logWithLabel)("custom", `Backup scheduled with cron expression: ${CRON_BACKUPS_TIME}`, {
            customLabel: "Backups",
        });
        console.debug("[Engine][setupBackupService] Backup service scheduled.");
    }
    /**
     * Starts the WhatsApp module if it is enabled in the configuration.
     *
     * @remarks
     * If the WhatsApp module is disabled, a log message is displayed indicating that
     * the module has not started.
     *
     * @throws {ProyectError} If the WhatsApp module fails to start.
     * @returns {Promise<void>} A promise that resolves when the WhatsApp module is processed.
     */
    async conditionallyStartWhatsApp() {
        console.debug("[Engine][conditionallyStartWhatsApp] Checking if WhatsApp module should start.");
        try {
            if (this.config.modules.whatsapp.enabled) {
                console.debug("[Engine][conditionallyStartWhatsApp] WhatsApp module enabled. Starting...");
                await this.whatsapp.start();
                console.debug("[Engine][conditionallyStartWhatsApp] WhatsApp module started.");
            }
            else {
                (0, console_1.logWithLabel)("custom", [
                    "Client is not ready!",
                    `  ${emojis_json_1.default.loading}  ${chalk_1.default.grey("The WhatsApp API module has not started.")}`,
                ].join("\n"), {
                    customLabel: "whatsapp",
                });
                console.debug("[Engine][conditionallyStartWhatsApp] WhatsApp module is disabled in config.");
            }
        }
        catch (err) {
            console.error(err);
            console.debug("[Engine][conditionallyStartWhatsApp] Error starting WhatsApp module:", err);
            throw new error_extend_1.ProyectError(`WhatsApp module failed to start: ${err}`);
        }
    }
    /**
     * Starts the core modules of the application.
     *
     * @remarks
     * This method initializes the Discord module, the API server module, and optionally
     * the WhatsApp module. It ensures that all modules are started asynchronously.
     *
     * @returns {Promise<void>} A promise that resolves when all modules have been successfully started.
     * @throws {ProyectError} If any module fails to start.
     */
    async start() {
        console.debug("[Engine][start] Starting application engine.");
        try {
            await (0, errors_1.ErrorConsole)(this.discord);
            console.debug("[Engine][start] ErrorConsole initialized.");
            await this.initializeModules();
            console.debug("[Engine][start] Core modules initialized.");
            await this.clientCreate();
            console.debug("[Engine][start] Discord client created in DB.");
            await (0, reminders_1.loadPendingReminders)();
            console.debug("[Engine][start] Pending reminders loaded.");
        }
        catch (err) {
            console.error(err);
            console.debug("[Engine][start] Error during startup:", err);
            throw new error_extend_1.ProyectError(`Failed to start the application: ${err}`);
        }
    }
    /**
     * Initializes the core modules of the application in parallel and measures load times.
     *
     * @returns {Promise<void>} A promise that resolves when all modules are initialized.
     * @throws {ProyectError} If any module fails to initialize.
     */
    async initializeModules() {
        console.debug("[Engine][initializeModules] Initializing core modules (Discord, API, WhatsApp, Backups, Monitoring).");
        try {
            // Arranca Discord y API en paralelo
            await Promise.all([this.discord.start(), this.api.start()]);
            console.debug("[Engine][initializeModules] Discord and API started.");
            // Valid licence product
            /*       if (!this.LicenceValid) {
              throw new ProyectError("Invalid licence product. Please check your licence key.");
            } */
            // WhatsApp y backups después (si dependen de los anteriores)
            await Promise.all([this.conditionallyStartWhatsApp(), this.configureMonitoring(), this.setupBackupService()]);
            console.debug("[Engine][initializeModules] WhatsApp, Monitoring, and Backups initialized.");
        }
        catch (err) {
            console.trace("Error in initializeModules:", err);
            console.debug("[Engine][initializeModules] Error initializing modules:", err);
            throw new error_extend_1.ProyectError(`Failed to initialize modules: ${err}`);
        }
    }
    /**
     * Creates or updates the Discord client configuration in the database.
     *
     * @returns {Promise<void>} A promise that resolves when the client is created or updated.
     * @throws {ProyectError} If the client configuration fails to be created or updated.
     */
    async clientCreate() {
        console.debug("[Engine][clientCreate] Creating/updating Discord client in DB.");
        try {
            console.time("DB:CreateClient");
            await this.DB.createClient(client, "");
            console.timeEnd("DB:CreateClient");
            debugLog("DB", "Discord client registered in the database");
            console.debug("[Engine][clientCreate] Discord client registered in DB.");
        }
        catch (err) {
            console.trace("Error in clientCreate:", err);
            console.debug("[Engine][clientCreate] Error registering Discord client in DB:", err);
            throw new error_extend_1.ProyectError(`Failed to Discord client configuration: ${err}`);
        }
    }
}
exports.Engine = Engine;
/**
 * Main application engine instance.
 * @type {Engine}
 */
const main = new Engine();
exports.main = main;
/**
 * Discord client instance exported for external usage.
 * @type {MyClient}
 */
const client = main.discord;
exports.client = client;
const GiveawayManager = new giveaway_1.GiveawayService();
exports.GiveawayManager = GiveawayManager;
/**
 * Starts the application and handles any errors during the startup process.
 *
 * @remarks
 * If the application fails to start, a custom error is thrown, and the process exits
 * with a failure code.
 */
main.start().catch((err) => {
    (0, console_1.logWithLabel)("custom", `Failed to start the application: ${err}`, {
        customLabel: "Startup",
    });
    console.debug("[main] Application failed to start:", err);
    process.exit(1); // Exit the process with a failure code
});
//# sourceMappingURL=main.js.map
//# debugId=7a03948d-2d98-58ab-b0e6-879139fe2bc0
