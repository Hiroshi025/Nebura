import { ObjectId } from "bson"; // BSON library for working with ObjectId: https://www.npmjs.com/package/bson
import chalk from "chalk"; // Chalk library for terminal string styling: https://www.npmjs.com/package/chalk

import emojis from "@config/json/emojis.json"; // JSON file containing emoji configurations
import { Utils } from "@extenders/discord/utils.extend"; // Utility functions for Discord
import { ProyectError } from "@extenders/error.extend"; // Custom error handling class
import { PrismaClient } from "@prisma/client"; // Prisma ORM client: https://www.prisma.io/
import { loadPendingReminders } from "@utils/functions/reminders"; // Function to load pending reminders

import { MyClient } from "./modules/discord/client"; // Custom Discord client implementation
import { ErrorConsole } from "./modules/discord/structure/handlers/errors"; // Error handling for Discord
import { MyApp } from "./modules/whatsapp"; // WhatsApp module
import { API } from "./server"; // API server module
import { config } from "./shared/utils/config"; // Application configuration
import { logWithLabel } from "./shared/utils/functions/console"; // Logging utility
import { BackupService } from "./structure/backups"; // Backup service
import { ProyectConfig } from "./typings/config"; // TypeScript type for configuration

process.loadEnvFile(); // Load environment variables from a file
const defaultConfig = config as ProyectConfig; // Cast configuration to ProyectConfig type
const { CRON_BACKUPS_TIME } = process.env; // Destructure environment variables

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
  public readonly prisma: PrismaClient; // Prisma client instance for database operations
  public readonly discord: MyClient; // Discord client instance
  public readonly whatsapp: MyApp; // WhatsApp module instance
  public readonly api: API; // API server instance

  /**
   * Initializes the core module instances.
   *
   * @param prisma - Instance of PrismaClient for database operations. Defaults to a new instance.
   * @param config - Configuration object for the application. Defaults to the loaded configuration.
   * @param utils - Utility functions for Discord. Defaults to a new Utils instance.
   * @param discord - Instance of the Discord client. Defaults to a new MyClient instance.
   * @param whatsapp - Instance of the WhatsApp module. Defaults to a new MyApp instance.
   * @param api - Instance of the API server. Defaults to a new API instance.
   */
  constructor(
    prisma: PrismaClient = Engine.createDefaultPrismaClient(),
    public readonly config: ProyectConfig = defaultConfig,
    public readonly utils: Utils = new Utils(),
    discord: MyClient = new MyClient(),
    whatsapp: MyApp = new MyApp(),
    api: API = new API(),
  ) {
    this.whatsapp = whatsapp;
    this.discord = discord;
    this.prisma = prisma;
    this.api = api;
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
   */
  private async setupBackupService(): Promise<void> {
    const backupClient = new BackupService();
    await backupClient.scheduleBackups(CRON_BACKUPS_TIME);

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
   */
  private async conditionallyStartWhatsApp(): Promise<void> {
    try {
      if (this.config.modules.whatsapp.enabled) {
        await this.whatsapp.start();
      } else {
        this.logWhatsAppDisabled();
      }
    } catch (err) {
      console.error(err);
      throw new ProyectError(`WhatsApp module failed to start: ${err}`);
    }
  }

  /**
   * Logs a message indicating that the WhatsApp module is disabled.
   *
   * @remarks
   * This method uses the `logWithLabel` utility to log a custom message with a timestamp
   * and module context.
   */
  private logWhatsAppDisabled(): void {
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

  /**
   * Starts the core modules of the application.
   *
   * @remarks
   * This method initializes the Discord module, the API server module, and optionally
   * the WhatsApp module. It ensures that all modules are started asynchronously.
   *
   * @returns A promise that resolves when all modules have been successfully started.
   * @throws {ProyectError} If any module fails to start.
   */
  public async start() {
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
   * Initializes the core modules of the application.
   *
   * @remarks
   * This method starts the Discord and API modules. If the WhatsApp module is enabled
   * in the configuration, it will also start the WhatsApp module. Otherwise, it logs
   * a message indicating that the WhatsApp module is not started.
   *
   * @throws {ProyectError} If any module fails to initialize.
   */
  private async initializeModules() {
    try {
      await Promise.all([this.discord.start(), this.api.start()]);
      await this.conditionallyStartWhatsApp();
      await this.configureMonitoring();
      await this.setupBackupService();
    } catch (err) {
      console.error(err);
      throw new ProyectError(`Failed to initialize modules: ${err}`);
    }
  }

  /**
   * Creates or updates the Discord client configuration in the database.
   *
   * @remarks
   * This method uses the Prisma client to upsert the Discord client configuration
   * based on the token. If the configuration does not exist, it creates a new entry.
   *
   * @throws {ProyectError} If the upsert operation fails.
   */
  private async clientCreate() {
    try {
      const data = config.modules.discord;
      const validId = new ObjectId().toHexString();

      await this.prisma.myDiscord.upsert({
        where: { token: data.token },
        update: {
          token: data.token,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
        },
        create: {
          id: validId,
          token: data.token,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          owners: config.modules.discord.owners,
        },
      });
    } catch (err) {
      console.error(err);
      throw new ProyectError(`Failed to Discord client configuration: ${err}`);
    }
  }
}

const main = new Engine();
const client = main.discord;

process.on("SIGINFO", (reason) => {
  console.log("SIGINFO received:", reason);
  logWithLabel("custom", `SIGINFO received: ${reason}`, {
    customLabel: "Signal",
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Exiting gracefully...");
  logWithLabel("custom", "SIGINT received. Exiting gracefully...", {
    customLabel: "Signal",
  });
  process.exit(0); // Exit the process gracefully
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Exiting gracefully...");
  logWithLabel("custom", "SIGTERM received. Exiting gracefully...", {
    customLabel: "Signal",
  });
  process.exit(0); // Exit the process gracefully
});

/**
 * Starts the application and handles any errors during the startup process.
 *
 * @remarks
 * If the application fails to start, a custom error is thrown, and the process exits
 * with a failure code.
 */
main.start().catch((err) => {
  console.error(err);
  logWithLabel("error", `Failed to start the application: ${err}`, {
    customLabel: "Startup",
  });
  process.exit(1); // Exit the process with a failure code
});

export { client, main };
