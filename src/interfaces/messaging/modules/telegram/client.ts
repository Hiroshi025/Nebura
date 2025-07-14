import { debuglog } from "node:util";
import { Telegraf } from "telegraf";

import { TelegramError } from "@shared/utils/extends/error.extension";

const debug = debuglog("telegram");

const { TELEGRAM_BOT_TOKEN, TELEGRAM_ENABLED } = process.env;

/**
 * Class representing a Telegram client using the [Telegraf](https://telegraf.js.org/) library.
 *
 * This class is responsible for initializing and managing a Telegram bot instance.
 * It checks environment variables to determine if the bot should be started and handles
 * initialization errors gracefully.
 *
 * @example
 * ```typescript
 * const telegram = new MyTelegram();
 * await telegram.start();
 * ```
 *
 * @see [Telegraf Documentation](https://telegraf.js.org/)
 */
export class MyTelegram {
  /**
   * The Telegraf client instance.
   *
   * @see [Telegraf Class](https://telegraf.js.org/#/?id=telegraf-class)
   */
  public client!: Telegraf;

  /**
   * Creates an instance of MyTelegram.
   * Logs the creation for debugging purposes.
   */
  constructor() {
    debug("MyTelegram instance created");
    console.log("[MyTelegram] Instance created");
  }

  /**
   * Initializes and starts the Telegram bot if enabled.
   *
   * This method checks the `TELEGRAM_ENABLED` and `TELEGRAM_BOT_TOKEN` environment variables.
   * If the bot is enabled and the token is set, it initializes the Telegraf client.
   *
   * @throws {TelegramError} If the Telegram configuration is incomplete or disabled.
   * @throws {Error} If there is an error initializing the Telegraf client.
   *
   * @returns {Promise<void>} Resolves when the initialization is complete or skipped.
   */
  public async start(): Promise<void> {
    console.time("[MyTelegram] start() execution time");
    debug("Checking if Telegram is enabled...");
    console.log("[MyTelegram] Checking TELEGRAM_ENABLED:", TELEGRAM_ENABLED);

    if (!TELEGRAM_ENABLED || TELEGRAM_ENABLED === "false") {
      debug("The Telegram customer is not activated");
      console.warn("[MyTelegram] Telegram client is not activated");
      console.timeEnd("[MyTelegram] start() execution time");
      return;
    }

    debug("Starting Telegram bot...");
    console.log("[MyTelegram] Starting Telegram bot...");
    if (!TELEGRAM_BOT_TOKEN) {
      debug("Telegram configuration within the customer is not complete, or is deactivated");
      console.error("[MyTelegram] TELEGRAM_BOT_TOKEN is missing or not set");
      console.timeEnd("[MyTelegram] start() execution time");
      throw new TelegramError("Telegram configuration within the customer is not complete, or is deactivated");
    }
    try {
      console.time("[MyTelegram] Telegraf initialization");
      this.client = new Telegraf(TELEGRAM_BOT_TOKEN);
      debug("Telegraf client initialized successfully");
      console.log("[MyTelegram] Telegraf client initialized successfully");
      console.timeEnd("[MyTelegram] Telegraf initialization");
      // Optionally, you can launch the bot here and log it
      // await this.client.launch();
      // debug("Telegram bot launched");
      // console.log("[MyTelegram] Telegram bot launched");
    } catch (error) {
      debug("Error initializing Telegraf client: %O", error);
      console.error("[MyTelegram] Error initializing Telegraf client:", error);
      console.timeEnd("[MyTelegram] start() execution time");
      throw error;
    }
    console.timeEnd("[MyTelegram] start() execution time");
  }
}
