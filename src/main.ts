import { PrismaClient } from "@prisma/client";

import { ProyectError } from "./infrastructure/extenders/errors.extender";
import { MainDiscord } from "./modules/discord/infrastructure/client";
import { API } from "./server";

process.loadEnvFile();

/**
 * Main class responsible for initializing and managing the core modules of the application.
 */
export class MainGlobal {
  /**
   * Prisma client instance used for database interactions.
   */
  public prisma: PrismaClient;

  /**
   * Instance of the Discord module.
   */
  public discord: MainDiscord;

  /**
   * Instance of the API server module.
   */
  public api: API;

  /**
   * Constructor that initializes the core module instances.
   */
  constructor() {
    this.discord = new MainDiscord();
    this.api = new API();
    this.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
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
  public async start() {
    await this.discord.start();
    await this.api.start();
  }
}

/**
 * Global instance of the `MainGlobal` class.
 */
export const main = new MainGlobal();

// Starts the application and handles any errors during the startup process.
main.start().catch((err) => {
  throw new ProyectError(`Error starting the application: ${err}`);
});
