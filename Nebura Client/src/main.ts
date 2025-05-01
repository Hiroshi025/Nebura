import { ObjectId } from "bson";
import chalk from "chalk";

import emojis from "@config/json/emojis.json";
import { Utils } from "@extenders/discord/utils.extender";
import { ProyectError } from "@extenders/errors.extender";
import { PrismaClient } from "@prisma/client";
import { loadPendingReminders } from "@utils/functions/reminders";

import { MyClient } from "./modules/discord/structure/client";
import { ErrorConsole } from "./modules/discord/structure/handlers/errors";
import { MyApp } from "./modules/whatsapp";
import { API } from "./server";
import { config } from "./shared/utils/config";
import { logWithLabel } from "./shared/utils/functions/console";
import { ProyectConfig } from "./typings/config";

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
   */
  public whatsapp: MyApp;

  /**
   * Configuration object for the project.
   */
  public config: ProyectConfig;

  /**
   * Instance of the Utils class, providing utility functions and helpers.
   */
  public utils: Utils;

  /**
   * Initializes the core module instances.
   *
   * @param prisma - Instance of PrismaClient for database operations.
   * @param config - Configuration object for the application.
   * @param discord - Instance of the Discord client.
   * @param whatsapp - Instance of the WhatsApp module.
   * @param api - Instance of the API server.
   */
  constructor(
    prisma: PrismaClient = new PrismaClient({
      log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "info" },
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ],
      errorFormat: "minimal",
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
    config: ProyectConfig = defaultConfig,
    discord: MyClient = new MyClient(),
    whatsapp: MyApp = new MyApp(),
    api: API = new API(),
  ) {
    this.utils = new Utils();
    this.whatsapp = whatsapp;
    this.discord = discord;
    this.api = api;
    this.prisma = prisma;
    this.config = config;
  }

  /**
   * Starts the core modules of the application.
   *
   * This method initializes the Discord module, the API server module, and optionally the WhatsApp module.
   * It ensures that all modules are started asynchronously.
   *
   * @returns A promise that resolves when all modules have been successfully started.
   * @throws {ProyectError} If any module fails to start.
   */
  public async start() {
    try {
      await ErrorConsole(this.discord);
      await this.initializeModules();
      await this.clientCreate();
      await loadPendingReminders();
    } catch (err) {
      this.handleError(err);
      process.exit(1);
    }
  }

  /**
   * Initializes the core modules of the application.
   *
   * This method starts the Discord and API modules. If the WhatsApp module is enabled in the configuration,
   * it will also start the WhatsApp module. Otherwise, it logs a message indicating that the WhatsApp module is not started.
   *
   * @throws {ProyectError} If any module fails to initialize.
   */
  private async initializeModules() {
    try {
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
    } catch (err) {
      throw new ProyectError(`Failed to initialize modules: ${err}`);
    }
  }

  /**
   * Handles errors that occur during the application startup process.
   *
   * @param err - The error object or message.
   * @throws {ProyectError} A custom error with a detailed message.
   */
  private handleError(err: unknown): void {
    throw new ProyectError(`Error starting the application: ${err}`);
  }

  /**
   * Creates or updates the Discord client configuration in the database.
   *
   * This method uses the Prisma client to upsert the Discord client configuration based on the token.
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
      throw new ProyectError(`Failed to create/update Discord client configuration: ${err}`);
    }
  }
}

/**
 * Global instance of the `Engine` class.
 */
export const main = new Engine();

/**
 * Global instance of the Discord client.
 */
export const client = main.discord;

// Starts the application and handles any errors during the startup process.
main.start();
