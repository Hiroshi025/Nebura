import { debuglog } from "node:util";
import { Telegraf } from "telegraf";

import { TelegramError } from "@shared/utils/extends/error.extension";

const debug = debuglog("telegram");

const { TELEGRAM_BOT_TOKEN, TELEGRAM_ENABLED } = process.env;

export class MyTelegram {
  public client!: Telegraf;

  constructor() {
    debug("MyTelegram instance created");
    console.log("[MyTelegram] Instance created");
  }

  public async start() {
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
