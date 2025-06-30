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
import emojis from "@config/json/emojis.json";
import { MyTelegram } from "@messaging/modules/telegram/client";
import { PrismaClient } from "@prisma/client"; // Prisma ORM client: https://www.prisma.io/
import { ProyectError } from "@utils/extends/error.extension"; // Custom error handling class
import { loadPendingReminders } from "@utils/functions/reminders"; // Function to load pending reminders

import { API } from "./";
import { MyDiscord } from "./interfaces/messaging/modules/discord/client"; // Custom Discord client implementation
import { ErrorConsole } from "./interfaces/messaging/modules/discord/structure/handlers/errors"; // Error handling for Discord
import { MyWhatsApp } from "./interfaces/messaging/modules/whatsapp/client"; // WhatsApp module
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
   * Instancia del cliente de Discord.
   * @readonly
   */
  public readonly discord: MyDiscord;

  /**
   * Instancia del cliente de Telegram.
   * @readonly
   */
  public readonly telegram: MyTelegram;

  /**
   * Instancia del módulo de WhatsApp.
   * @readonly
   */
  public readonly whatsapp: MyWhatsApp;

  /**
   * Instancia del servidor API.
   * @readonly
   */
  public readonly api: API;

  /**
   * Objeto de configuración de la aplicación.
   * @readonly
   */
  public readonly config: ProyectConfig;

  /**
   * Utilidades generales para Discord y otras operaciones.
   * @readonly
   */
  public readonly utils: Utils;

  /**
   * Instancia para operaciones de base de datos usando Prisma.
   * @readonly
   */
  public readonly DB: DBPrisma;

  /**
   * Inicializa las instancias principales de los módulos de la aplicación.
   *
   * @param prisma - Instancia de PrismaClient para operaciones de base de datos. Por defecto, se crea una nueva.
   * @param whatsapp - Instancia del módulo de WhatsApp. Por defecto, se crea una nueva.
   * @param telegram - Instancia del cliente de Telegram. Por defecto, se crea una nueva.
   * @param config - Objeto de configuración de la aplicación. Por defecto, se carga la configuración por defecto.
   * @param discord - Instancia del cliente de Discord. Por defecto, se crea una nueva.
   * @param DB - Instancia para operaciones de base de datos. Por defecto, se crea una nueva.
   * @param utils - Funciones utilitarias generales. Por defecto, se crea una nueva.
   * @param api - Instancia del servidor API. Por defecto, se crea una nueva.
   */
  constructor() {
    console.debug("[Engine][constructor] Initializing Engine with provided modules.");
    this.prisma = new PrismaClient({
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

    this.telegram = new MyTelegram(),
    this.whatsapp = new MyWhatsApp(),
    this.discord = new MyDiscord(),

    
    this.config = defaultConfig;
    this.utils = new Utils(),
    this.DB = new DBPrisma(),
    this.api = new API()
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
  private async setupBackupService(): Promise<void> {
    console.debug("[Engine][setupBackupService] Setting up backup service.");
    if (config.tasks.backups.enabled !== true) {
      console.debug("[Engine][setupBackupService] Backups are disabled in config.");
      return;
    }
    await new Backups().scheduleBackups(CRON_BACKUPS_TIME);
    logWithLabel("custom", `Backup scheduled with cron expression: ${CRON_BACKUPS_TIME}`, {
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
  private async conditionallyStartWhatsApp(): Promise<void> {
    console.debug("[Engine][conditionallyStartWhatsApp] Checking if WhatsApp module should start.");
    try {
      if (this.config.modules.whatsapp.enabled) {
        console.debug("[Engine][conditionallyStartWhatsApp] WhatsApp module enabled. Starting...");
        await this.whatsapp.start();
        console.debug("[Engine][conditionallyStartWhatsApp] WhatsApp module started.");
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
        console.debug("[Engine][conditionallyStartWhatsApp] WhatsApp module is disabled in config.");
      }
    } catch (err) {
      console.error(err);
      console.debug("[Engine][conditionallyStartWhatsApp] Error starting WhatsApp module:", err);
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
    console.debug("[Engine][start] Starting application engine.");
    try {
      await ErrorConsole(this.discord);
      await this.initializeModules();
      await loadPendingReminders();
      await this.clientCreate();
    } catch (err) {
      console.error(err);
      console.debug("[Engine][start] Error during startup:", err);
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
      await Promise.all([this.discord.start(), this.api.start(), this.telegram.start()]);

      // Valid licence product
      /*       if (!this.LicenceValid) {
        throw new ProyectError("Invalid licence product. Please check your licence key.");
      } */

      // WhatsApp y backups después (si dependen de los anteriores)
      await Promise.all([this.conditionallyStartWhatsApp(), this.configureMonitoring(), this.setupBackupService()]);
    } catch (err) {
      console.trace("Error in initializeModules:", err);
      console.debug("[Engine][initializeModules] Error initializing modules:", err);
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
    console.debug("[Engine][clientCreate] Creating/updating Discord client in DB.");
    try {
      console.time("DB:CreateClient");
      await this.DB.createClient(client, "");
      console.timeEnd("DB:CreateClient");
      debugLog("DB", "Discord client registered in the database");
      console.debug("[Engine][clientCreate] Discord client registered in DB.");
    } catch (err) {
      console.trace("Error in clientCreate:", err);
      console.debug("[Engine][clientCreate] Error registering Discord client in DB:", err);
      throw new ProyectError(`Failed to Discord client configuration: ${err}`);
    }
  }

  /*   private async LicenceValid() {
    const { LICENCE, HWID } = process.env;
    const res = await axios({
      method: "POST",
      baseURL: hostURL(),
      url: `/api/v1/license/validate/${LICENCE}`,
      headers: {
        "Content-Type": "application/json",
        "x-license-key": LICENCE,
        "x-hwid": HWID,
      },
      data: { hwid: HWID },
    });

    if (res.status !== 200) return false;
    return true;
  } */
}

/**
 * Main application engine instance.
 * @type {Engine}
 */
const main: Engine = new Engine();

/**
 * Discord client instance exported for external usage.
 * @type {MyDiscord}
 */
const client: MyDiscord = main.discord;
const mywhatsapp: MyWhatsApp = main.whatsapp;
const mytelegram: MyTelegram = main.telegram;

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
  console.debug("[main] Application failed to start:", err);
  process.exit(1); // Exit the process with a failure code
});

/**
 * Exports the Discord client and main engine instance for external usage.
 * @see {@link MyDiscord}
 * @see {@link Engine}
 */
export { client, main, mytelegram, mywhatsapp };
