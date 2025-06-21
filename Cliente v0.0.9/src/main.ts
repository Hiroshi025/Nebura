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

import chalk from "chalk";

import { Utils } from "@/shared/class/utils";
import { ProyectError } from "@/shared/infrastructure/extends/error.extend"; // Custom error handling class
import emojis from "@config/json/emojis.json";
import { GiveawayService } from "@modules/discord/structure/giveaway";
import { PrismaClient } from "@prisma/client"; // Prisma ORM client: https://www.prisma.io/
import { loadPendingReminders } from "@utils/functions/reminders"; // Function to load pending reminders

import { API } from "./";
import { MyClient } from "./interfaces/messaging/modules/discord/client"; // Custom Discord client implementation
import { ErrorConsole } from "./interfaces/messaging/modules/discord/structure/handlers/errors"; // Error handling for Discord
import { MyApp } from "./interfaces/messaging/modules/whatsapp"; // WhatsApp module
import { Backups } from "./shared/class/backups";
import { DBPrisma } from "./shared/class/DB";
import { config } from "./shared/utils/config"; // Application configuration
import { logWithLabel } from "./shared/utils/functions/console"; // Logging utility
import { ProyectConfig } from "./typings/config"; // TypeScript type for configuration

process.loadEnvFile(); // Load environment variables from a file

/**
 * Default configuration object loaded from the config utility.
 * @type {ProyectConfig}
 */
const defaultConfig = config as ProyectConfig;

const { CRON_BACKUPS_TIME } = process.env;

/**
 * Utility for detailed debug logging using environment variables.
 *
 * @param label - The label for the debug log.
 * @param args - Additional arguments to log.
 */
function debugLog(label: string, ...args: any[]) {
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
export class Engine {
  /**
   * Prisma client instance for database operations.
   * @readonly
   */
  public readonly prisma: PrismaClient;

  /**
   * Discord client instance.
   * @readonly
   */
  public readonly discord: MyClient;

  /**
   * WhatsApp module instance.
   * @readonly
   */
  public readonly whatsapp: MyApp;

  /**
   * API server instance.
   * @readonly
   */
  public readonly api: API;

  /**
   * Application configuration object.
   * @readonly
   */
  public readonly config: ProyectConfig;

  /**
   * Utility functions for Discord.
   * @readonly
   */
  public readonly utils: Utils;
  /**
   * Database operations instance using Prisma.
   * @readonly
   */
  public readonly DB: DBPrisma;

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
  constructor(
    prisma: PrismaClient = Engine.createDefaultPrismaClient(),
    config: ProyectConfig = defaultConfig,
    discord: MyClient = new MyClient(),
    DB: DBPrisma = new DBPrisma(),
    whatsapp: MyApp = new MyApp(),
    utils: Utils = new Utils(),
    api: API = new API(),
  ) {
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
  private static createDefaultPrismaClient(): PrismaClient {
    return new PrismaClient({
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
  private async configureMonitoring(): Promise<void> {
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
  private async setupBackupService(): Promise<void> {
    if (process.env.BACKUPS_ENABLED !== "true") return;
    await new Backups().scheduleBackups(CRON_BACKUPS_TIME);
    logWithLabel("custom", `Backup scheduled with cron expression: ${CRON_BACKUPS_TIME}`, {
      customLabel: "Backups",
    });
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
  private async conditionallyStartWhatsApp(): Promise<void> {
    try {
      if (this.config.modules.whatsapp.enabled) {
        await this.whatsapp.start();
      } else {
        logWithLabel(
          "custom",
          [
            "Client is not ready!",
            `  ${emojis.loading}  ${chalk.grey("The WhatsApp API module has not started.")}`,
          ].join("\n"),
          {
            customLabel: "whatsapp",
          },
        );
      }
    } catch (err) {
      console.error(err);
      throw new ProyectError(`WhatsApp module failed to start: ${err}`);
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
  public async start(): Promise<void> {
    try {
      await ErrorConsole(this.discord);
      await this.initializeModules();

      //// Load the configuration and set up the Discord client ////
      await this.clientCreate();
      await loadPendingReminders();
    } catch (err) {
      console.error(err);
      throw new ProyectError(`Failed to start the application: ${err}`);
    }
  }

  /**
   * Initializes the core modules of the application in parallel and measures load times.
   *
   * @returns {Promise<void>} A promise that resolves when all modules are initialized.
   * @throws {ProyectError} If any module fails to initialize.
   */
  private async initializeModules(): Promise<void> {
    try {
      // Arranca Discord y API en paralelo
      await Promise.all([this.discord.start(), this.api.start()]);

      // WhatsApp y backups después (si dependen de los anteriores)
      await Promise.all([
        this.conditionallyStartWhatsApp(),
        this.configureMonitoring(),
        this.setupBackupService(),
      ]);

      console.timeEnd("Total modules");
    } catch (err) {
      console.trace("Error in initializeModules:", err);
      throw new ProyectError(`Failed to initialize modules: ${err}`);
    }
  }

  /**
   * Creates or updates the Discord client configuration in the database.
   *
   * @returns {Promise<void>} A promise that resolves when the client is created or updated.
   * @throws {ProyectError} If the client configuration fails to be created or updated.
   */
  private async clientCreate(): Promise<void> {
    try {
      console.time("DB:CreateClient");
      await this.DB.createClient(client, "");
      console.timeEnd("DB:CreateClient");
      debugLog("DB", "Discord client registered in the database");
    } catch (err) {
      console.trace("Error in clientCreate:", err);
      throw new ProyectError(`Failed to Discord client configuration: ${err}`);
    }
  }
}

/**
 * Main application engine instance.
 * @type {Engine}
 */
const main: Engine = new Engine();

/**
 * Discord client instance exported for external usage.
 * @type {MyClient}
 */
const client: MyClient = main.discord;
const GiveawayManager = new GiveawayService();

/**
 * Starts the application and handles any errors during the startup process.
 *
 * @remarks
 * If the application fails to start, a custom error is thrown, and the process exits
 * with a failure code.
 */
main.start().catch((err) => {
  logWithLabel("custom", `Failed to start the application: ${err}`, {
    customLabel: "Startup",
  });
  process.exit(1); // Exit the process with a failure code
});

/**
 * Exports the Discord client and main engine instance for external usage.
 * @see {@link MyClient}
 * @see {@link Engine}
 */
export { client, GiveawayManager, main };
