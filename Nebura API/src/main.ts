import emojis from "@config/json/emojis.json";
import { PrismaClient } from "@prisma/client";

import { ProyectError } from "./infrastructure/extenders/errors.extender";
import { MyClient } from "./modules/discord/infrastructure/client";
import { MyApp } from "./modules/whatsapp";
import { API } from "./server";
import { config } from "./shared/utils/config";
import { logWithLabel } from "./shared/utils/functions/console";
import { ProyectConfig } from "./typings/package/config";

//import { globalCleanup } from "./shared/utils/runCleanTask";

process.loadEnvFile();
const defaultConfig = config as ProyectConfig;

/**
 * Main class responsible for initializing and managing the core modules of the application.
 */
export class Engine {
  /**
   * Prisma client instance used for database interactions.
   */
  public prisma: PrismaClient;

  /**
   * Instance of the Discord module.
   */
  public discord: MyClient;

  /**
   * Instance of the API server module.
   */
  public api: API;

  /**
   * Instance of the WhatsApp module.
   * This module is responsible for handling WhatsApp interactions and functionalities.
   */
  public whatsapp: MyApp;

  /**
   * Configuration object for the project.
   */
  public config: ProyectConfig;

  /**
   * Constructor that initializes the core module instances.
   */
  constructor(
    prisma: PrismaClient = new PrismaClient({ log: ["query", "info", "warn", "error"] }),
    discord: MyClient = new MyClient(),
    api: API = new API(),
    whatsapp: MyApp = new MyApp(),
    config: ProyectConfig = defaultConfig,
  ) {
    this.prisma = prisma;
    this.discord = discord;
    this.api = api;
    this.whatsapp = whatsapp;
    this.config = config;
  }

  /**
   * Starts the core modules of the application.
   *
   * This method initializes the Discord module and the API server module.
   * It ensures that both modules are started asynchronously.
   *
   * @returns {Promise<void>} A promise that resolves when all modules have been successfully started.
   * @throws {Error} Throws an error if any module fails to start.
   */
  public async start(): Promise<void> {
    try {
      await this.initializeModules();
    } catch (err) {
      this.handleError(err);
    }
  }

  private async initializeModules(): Promise<void> {
    await Promise.all([this.discord.start(), this.api.start()]);

    if (this.config.modules.whatsapp.enabled) {
      await this.whatsapp.start();
    } else {
      logWithLabel(
        "custom",
        [
          "Client is not ready!",
          `  ${emojis.loading}  The WhatsApp API module has not started.`,
          `  ${emojis.loading}  The WhatsApp API module is running on version v1.0.0.`,
        ].join("\n"),
        "Whatsapp",
      );
    }
  }

  private handleError(err: unknown): void {
    throw new ProyectError(`Error starting the application: ${err}`);
  }
}

/**
 * Global instance of the `Engine` class.
 */
export const main = new Engine();
export const client = main.discord;

// Starts the application and handles any errors during the startup process.
main.start();
