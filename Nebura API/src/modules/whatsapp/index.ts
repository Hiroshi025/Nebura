import chalk from "chalk";
import { format } from "date-fns";
import * as ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import qrcode from "qrcode-terminal";
import { Client, LocalAuth, Message } from "whatsapp-web.js";

import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

//const store = new PrismaStore();
/**
 * Represents the WhatsApp module for handling interactions and functionalities.
 */
export class MyApp {
  /**
   * Instance of the WhatsApp client.
   */
  public client!: Client;

  /**
   * Directory where Excel logs are stored.
   */
  private excelDirectory: string;

  /**
   * Current date string used for log file naming.
   */
  private currentDate: string;

  /**
   * Instance of the ExcelJS workbook.
   */
  private workbook!: ExcelJS.Workbook;

  /**
   * Instance of the ExcelJS worksheet.
   */
  private worksheet!: ExcelJS.Worksheet;

  /**
   * Initializes the WhatsApp module and sets up the Excel logging system.
   */
  constructor() {
    this.excelDirectory = path.join(config.project.logs, "whatsapp", "chats");
    this.currentDate = this.getCurrentDateString();
    this.initializeExcelFile();
  }

  /**
   * Initializes the WhatsApp client and sets up event listeners.
   */
  private InitClient = async () => {
    this.client = new Client({
      /*       authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 60000,
        dataPath: path.join(config.project.logs, "whatsapp"),
      }), */
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox"],
      },
    });

    this.client.on("qr", (qr) => {
      logWithLabel("custom", "QR RECEIVED. PLEASE SCAN", "WhatsApp");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("authenticated", () => {
      logWithLabel("custom", "AUTHENTICATED. The session is ready to be used.", "WhatsApp");
      logWithLabel("custom", "Registered Client on the Web", "WhatsApp");
    });

    this.client.on("message", async (msg: Message) => {
      try {
        const contact = await msg.getContact();

        const messageData = {
          timestamp: msg.timestamp,
          sender: contact.name || contact.pushname || "Unknown",
          number: msg.from,
          hasAttachment: msg.hasMedia,
          attachmentType: msg.hasMedia ? (await msg.downloadMedia()).mimetype.split("/")[0] : null,
          message: msg.body,
          id: msg.id.id,
        };

        // Save to Excel
        await this.saveToExcel(messageData);

        // Log to console
        logWithLabel(
          "info",
          `[${new Date().toLocaleTimeString()}] Message from ${messageData.sender}: ${messageData.message.substring(0, 30)}${messageData.message.length > 30 ? "..." : ""}`,
          "WhatsApp",
        );
      } catch (error) {
        logWithLabel("error", `Error processing message: ${error}`, "WhatsApp");
      }
    });

    this.client.initialize();
  };

  /**
   * Gets the current date as a string in the format "yyyy-MM-dd".
   * @returns {string} The current date string.
   */
  private getCurrentDateString(): string {
    return format(new Date(), "yyyy-MM-dd");
  }

  /**
   * Constructs the file path for the Excel log file based on the current date.
   * @returns {string} The file path for the Excel log.
   */
  private getExcelFilePath(): string {
    return path.join(this.excelDirectory, `messages_${this.currentDate}.xlsx`);
  }

  /**
   * Checks if the date has changed and reinitializes the Excel file if necessary.
   */
  private checkDateChange() {
    const today = this.getCurrentDateString();
    if (today !== this.currentDate) {
      this.currentDate = today;
      this.initializeExcelFile();
    }
  }

  /**
   * Ensures that the directory for storing Excel logs exists.
   * If it does not exist, it creates the directory.
   */
  private ensureDirectoryExists() {
    if (!fs.existsSync(this.excelDirectory)) {
      fs.mkdirSync(this.excelDirectory, { recursive: true });
    }
  }

  /**
   * Initializes the Excel file for logging messages.
   * If the file already exists, it loads the existing workbook.
   * Otherwise, it creates a new workbook and worksheet.
   */
  private initializeExcelFile = async () => {
    this.ensureDirectoryExists();
    const filePath = this.getExcelFilePath();

    this.workbook = new ExcelJS.Workbook();

    if (fs.existsSync(filePath)) {
      await this.workbook.xlsx.readFile(filePath);
      this.worksheet =
        this.workbook.getWorksheet("Messages") || this.workbook.addWorksheet("Messages");
    } else {
      this.worksheet = this.workbook.addWorksheet("Messages");
      this.worksheet.columns = [
        { header: "Date and Time", key: "timestamp", width: 25 },
        { header: "Sender", key: "sender", width: 30 },
        { header: "Number", key: "number", width: 20 },
        { header: "Has Attachment", key: "hasAttachment", width: 15 },
        { header: "Attachment Type", key: "attachmentType", width: 15 },
        { header: "Message", key: "message", width: 50 },
        { header: "Message ID", key: "id", width: 30 },
      ];

      this.worksheet.getRow(1).font = { bold: true };
    }
  };

  /**
   * Saves a message's data to the Excel log file.
   * @param messageData The data of the message to be logged.
   */
  private saveToExcel = async (messageData: any) => {
    this.checkDateChange(); // Check if the day has changed

    this.worksheet.addRow({
      timestamp: new Date(messageData.timestamp * 1000).toLocaleString(),
      sender: messageData.sender,
      number: messageData.number,
      hasAttachment: messageData.hasAttachment ? "Yes" : "No",
      attachmentType: messageData.attachmentType || "N/A",
      message: messageData.message || "N/A",
      id: messageData.id,
    });

    await this.workbook.xlsx.writeFile(this.getExcelFilePath());
  };

  /**
   * Starts the WhatsApp module and initializes the client.
   */
  public start = async () => {
    this.InitClient();
    this.client.on("ready", () => {
      logWithLabel(
        "custom",
        [
          "Client is ready!",
          `  ${emojis.info}  ${chalk.gray("The WhatsApp API module has started.")}`,
        ].join("\n"),
        "WhatsApp",
      );
    });
  };
}
