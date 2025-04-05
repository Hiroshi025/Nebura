import { PrismaClient } from "@prisma/client";

import { ProyectError } from "./infrastructure/extenders/errors.extender";
import { MyClient } from "./modules/discord/infrastructure/client";
import { API } from "./server";

//import { globalCleanup } from "./shared/utils/runCleanTask";

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
  public discord: MyClient;

  /**
   * Instance of the API server module.
   */
  public api: API;

  /**
   * Constructor that initializes the core module instances.
   */
  constructor() {
    this.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });

    this.discord = new MyClient();
    this.api = new API();
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
    await this.discord.start();
    await this.api.start();

    //TODO Evitar que las tareas se eliminen en caso de que el bot se reinicie, solo se eliminaran segun la la fecha de vencimiento
    //this.setup();
  }

/*   private setup() {
    const taskService = new TaskService();
    globalCleanup("Global Tasks", () => taskService.cleanUpTasks());

    return;
  } */
}

/**
 * Global instance of the `MainGlobal` class.
 */
export const main = new MainGlobal();
export const client = main.discord;

// Starts the application and handles any errors during the startup process.
main.start().catch((err) => {
  throw new ProyectError(`Error starting the application: ${err}`);
});
