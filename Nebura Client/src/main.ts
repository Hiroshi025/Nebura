import { ObjectId } from "bson"; // Importar para generar ObjectIDs
import chalk from "chalk";
import schedule from "node-schedule";

import emojis from "@config/json/emojis.json";
import { EmbedCorrect } from "@extenders/discord/embeds.extender";
import { Utils } from "@extenders/discord/utils.extender";
import { ProyectError } from "@extenders/errors.extender";
import { PrismaClient } from "@prisma/client";

import { MyClient } from "./modules/discord/structure/client";
import { ErrorConsole } from "./modules/discord/structure/handlers/error-console";
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
   * Chalk library instance for colored console output.
   */
  public chalk: typeof chalk;

  /**
   * Instance of the Utils class, providing utility functions and helpers.
   */
  public utils: Utils;

  /**
   * Constructor that initializes the core module instances.
   *
   * @param prisma - Instance of PrismaClient for database operations.
   * @param discord - Instance of the Discord client.
   * @param api - Instance of the API server.
   * @param whatsapp - Instance of the WhatsApp module.
   * @param config - Configuration object for the application.
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
    this.utils = new Utils();
  }

  /**
   * Starts the core modules of the application.
   *
   * This method initializes the Discord module, the API server module, and optionally the WhatsApp module.
   * It ensures that all modules are started asynchronously.
   *
   * @returns A promise that resolves when all modules have been successfully started.
   * @throws {Error} Throws an error if any module fails to start.
   */
  public async start(): Promise<void> {
    try {
      await ErrorConsole(this.discord);
      await this.initializeModules();
      await this.clientCreate();
      await loadPendingReminders(); // Load pending reminders
    } catch (err) {
      this.handleError(err);
    }
  }

  /**
   * Initializes the core modules of the application.
   *
   * This method starts the Discord and API modules. If the WhatsApp module is enabled in the configuration,
   * it will also start the WhatsApp module. Otherwise, it logs a message indicating that the WhatsApp module is not started.
   */
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

  /**
   * Handles errors that occur during the application startup process.
   *
   * @param err - The error object or message.
   * @throws {ProyectError} Throws a custom error with a detailed message.
   */
  private handleError(err: unknown): void {
    throw new ProyectError(`Error starting the application: ${err}`);
  }

  /**
   * Creates or updates the Discord client configuration in the database.
   *
   * This method uses the Prisma client to upsert the Discord client configuration based on the token.
   */
  private async clientCreate() {
    const data = config.modules.discord;

    // Generar un ObjectID válido si no existe
    const validId = new ObjectId().toHexString();

    await main.prisma.myDiscord.upsert({
      where: { token: data.token },
      update: {
        token: data.token,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      },
      create: {
        id: validId, // Asegurar que se use un ObjectID válido
        token: data.token,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      },
    });
  }
}

/**
 * Loads pending reminders from the database and schedules them.
 *
 * This function retrieves reminders that have not been sent and are scheduled for a future time.
 * It uses the `node-schedule` library to schedule the reminders and sends them to the respective users.
 */
async function loadPendingReminders(): Promise<void> {
  const pendingReminders = await main.prisma.reminder.findMany({
    where: {
      isSent: false,
      remindAt: { gte: new Date() },
    },
  });

  for (const reminder of pendingReminders) {
    schedule.scheduleJob(new Date(reminder.remindAt), async () => {
      const member = await client.guilds.cache
        .get(reminder.guildId)
        ?.members.fetch(reminder.userId);

      if (member) {
        await member
          .send({
            embeds: [new EmbedCorrect().setTitle(`Reminder!`).setDescription(reminder.message)],
          })
          .catch(() => {});

        await main.prisma.reminder.update({
          where: { id: reminder.id },
          data: { isSent: true },
        });
      }
    });
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
