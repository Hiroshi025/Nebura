import chalk from "chalk";

import emojis from "@config/json/emojis.json";
import { PrismaClient } from "@prisma/client";

import { MyClient } from "./modules/discord/structure/client";
import { ErrorConsole } from "./modules/discord/structure/handlers/error-console";
import { MyApp } from "./modules/whatsapp";
import { API } from "./server";
import { config } from "./shared/utils/config";
import { logWithLabel } from "./shared/utils/functions/console";
import { Utils } from "./structure/extenders/discord/utils.extender";
import { ProyectError } from "./structure/extenders/errors.extender";
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
   * Chalk library instance for colored console output.
   */
  public chalk: typeof chalk;

  /**
   * Logger instance for logging messages and errors.
   */
  //public logger: WinstonLogger;

  /**
   * Instance of the Utils class, providing utility functions and helpers.
   */
  public utils: Utils;

  /**
   * Constructor that initializes the core module instances.
   */
  constructor(
    prisma: PrismaClient = new PrismaClient({
      log: ["query", "info", "warn", "error"],
      errorFormat: "pretty",
    }),
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
    this.chalk = chalk;
    //this.logger = new WinstonLogger(14);
    this.utils = new Utils();
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
      //await this.logger.scheduleCleanup(24);
      await ErrorConsole(this.discord);
      await this.initializeModules();
      await this.clientCreate();
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
          `  ${emojis.loading}  ${chalk.grey("The WhatsApp API module has not started.")}`,
        ].join("\n"),
        "Whatsapp",
      );
    }
  }

  private handleError(err: unknown): void {
    throw new ProyectError(`Error starting the application: ${err}`);
  }

  private async clientCreate() {
    const data = config.modules.discord;
    await main.prisma.appDiscord.upsert({
      where: { token: data.token },
      update: {
        token: data.token,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      },
      create: {
        token: data.token,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      },
    });
  }
}

/**
 * Global instance of the `Engine` class.
 */
export const main = new Engine();
export const client = main.discord;

// Starts the application and handles any errors during the startup process.
main.start();
