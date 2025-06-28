import { debuglog } from "node:util";
import { Telegraf } from "telegraf";

import { TelegramError } from "@shared/utils/extends/error.extension";

const debug = debuglog("telegram");

const { TELEGRAM_BOT_TOKEN, TELEGRAM_ENABLED } = process.env;

export class MyTelegram {
  public client!: Telegraf;

  constructor() {
    debug("MyTelegram instance created");
  }

  public async start() {
    if (!TELEGRAM_ENABLED || TELEGRAM_ENABLED === "false") {
      debug("The Telegram customer is not activated");
      return;
    }
    
    debug("Starting Telegram bot...");
    if (!TELEGRAM_BOT_TOKEN) {
      debug("Telegram configuration within the customer is not complete, or is deactivated");
      throw new TelegramError("Telegram configuration within the customer is not complete, or is deactivated");
    }
    try {
      this.client = new Telegraf(TELEGRAM_BOT_TOKEN);
      debug("Telegraf client initialized successfully");
      // Optionally, you can launch the bot here and log it
      // await this.client.launch();
      // debug("Telegram bot launched");
    } catch (error) {
      debug("Error initializing Telegraf client: %O", error);
      throw error;
    }
  }
}