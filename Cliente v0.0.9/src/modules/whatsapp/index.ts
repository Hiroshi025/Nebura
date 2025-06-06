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

/**
 * Represents the WhatsApp module for handling interactions, logging, and statistics.
 *
 * - Logs all incoming messages to daily Excel files.
 * - Provides a private `/status` command for the bot number to get runtime statistics.
 * - Generates a daily Excel backup with client and chat statistics.
 */
export class MyApp {
  /**
   * Instance of the WhatsApp client.
   */
  public client!: Client;

  /**
   * Directory where chat Excel logs are stored.
   */
  private excelDirectory: string;

  /**
   * Current date string used for log file naming.
   */
  private currentDate: string;

  /**
   * Instance of the ExcelJS workbook for chat logs.
   */
  private workbook!: ExcelJS.Workbook;

  /**
   * Instance of the ExcelJS worksheet for chat logs.
   */
  private worksheet!: ExcelJS.Worksheet;

  /**
   * Timestamp (ms) when the client started.
   */
  private startTime: number;

  /**
   * Counter for unread messages since the last status check.
   */
  private unreadMessages: number;

  /**
   * Directory where status backup Excel files are stored.
   */
  private statusBackupDir: string;

  /**
   * Initializes the WhatsApp module, directories, and schedules status backups.
   *
   * @remarks
   * - Ensures all required directories exist.
   * - Initializes the daily Excel log file.
   * - Schedules the daily status backup.
   */
  constructor() {
    this.excelDirectory = path.join(config.project.logs, "whatsapp", "chats");
    this.currentDate = this.getCurrentDateString();
    this.startTime = Date.now();
    this.unreadMessages = 0;
    this.statusBackupDir = path.resolve("./config/backups/whatsapp");
    this.ensureDirectoryExists();
    this.ensureStatusBackupDirExists();
    this.initializeExcelFile();
    this.scheduleStatusBackup();
  }

  /**
   * Ensures that the directory for storing status backups exists.
   * If it does not exist, it creates the directory.
   */
  private ensureStatusBackupDirExists() {
    if (!fs.existsSync(this.statusBackupDir)) {
      fs.mkdirSync(this.statusBackupDir, { recursive: true });
    }
  }

  /**
   * Ensures that the directory for storing chat Excel logs exists.
   * If it does not exist, it creates the directory.
   */
  private ensureDirectoryExists() {
    if (!fs.existsSync(this.excelDirectory)) {
      fs.mkdirSync(this.excelDirectory, { recursive: true });
    }
  }

  /**
   * Schedules the status backup to run every 24 hours.
   * The backup is also generated immediately on startup.
   */
  private scheduleStatusBackup() {
    // Generate immediately on startup
    this.generateStatusBackup();

    // Log when scheduling the interval
    logWithLabel("custom", "Scheduled WhatsApp status backup every 24 hours.", {
      customLabel: "WhatsApp",
      context: { timestamp: new Date().toISOString() },
    });

    setInterval(
      async () => {
        logWithLabel("custom", "Generating scheduled WhatsApp status backup...", {
          customLabel: "WhatsApp",
          context: { timestamp: new Date().toISOString() },
        });
        await this.generateStatusBackup();
      },
      24 * 60 * 60 * 1000,
    );
  }

  /**
   * Generates a status backup Excel file with client and chat Excel statistics.
   * The backup includes uptime, Excel file stats, unread messages, and a list of chat log files.
   * The backup is saved in the status backup directory.
   */
  private async generateStatusBackup() {
    // Solo generar backup si la variable de entorno está activada
    if (process.env.WHATSAPP_BACKUPS !== "true") {
      return;
    }
    this.ensureStatusBackupDirExists();
    const now = new Date();
    const backupFileName = `status_${format(now, "yyyy-MM-dd_HH-mm-ss")}.xlsx`;
    const backupFilePath = path.join(this.statusBackupDir, backupFileName);

    // Gather stats
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSec = Math.floor(uptimeMs / 1000) % 60;
    const uptimeMin = Math.floor(uptimeMs / (1000 * 60)) % 60;
    const uptimeHr = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeStr = `${uptimeHr}h ${uptimeMin}m ${uptimeSec}s`;

    const files = fs.existsSync(this.excelDirectory)
      ? fs.readdirSync(this.excelDirectory).filter((f) => f.endsWith(".xlsx"))
      : [];
    const excelCount = files.length;
    const lastExcel = files.sort().reverse()[0] || "N/A";
    const excelPath = this.excelDirectory;
    const unread = this.unreadMessages;

    // Create workbook
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Status");

    ws.columns = [
      { header: "Stat", key: "stat", width: 30 },
      { header: "Value", key: "value", width: 50 },
    ];

    ws.addRow({ stat: "Uptime", value: uptimeStr });
    ws.addRow({ stat: "Excel files generated", value: excelCount });
    ws.addRow({ stat: "Last Excel file", value: lastExcel });
    ws.addRow({ stat: "Excel files location", value: excelPath });
    ws.addRow({ stat: "Unread messages", value: unread });
    ws.addRow({ stat: "Backup generated at", value: now.toLocaleString() });

    // Add chat Excel files info
    ws.addRow({});
    ws.addRow({ stat: "Chat Excel Files", value: "" });
    files.forEach((f) => {
      ws.addRow({ stat: "File", value: f });
    });

    await wb.xlsx.writeFile(backupFilePath);
  }

  /**
   * Initializes the WhatsApp client and sets up event listeners.
   * Handles QR, authentication, message logging, and the `/status` command.
   */
  private InitClient = async () => {
    this.client = new Client({
      /*authStrategy: new RemoteAuth({
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
      logWithLabel("custom", "QR RECEIVED. PLEASE SCAN", {
        customLabel: "WhatsApp",
        context: {
          clientId: this.client.info.wid.user,
          clientName: this.client.info.pushname,
          timestamp: new Date().toISOString(),
        },
      });
      qrcode.generate(qr, { small: true });
    });

    this.client.on("authenticated", () => {
      logWithLabel("custom", "AUTHENTICATED. The session is ready to be used.", {
        customLabel: "WhatsApp",
        context: {
          clientId: this.client.info.wid.user,
          clientName: this.client.info.pushname,
          timestamp: new Date().toISOString(),
        },
      });
      logWithLabel("custom", "Registered Client on the Web", {
        customLabel: "WhatsApp",
        context: {
          clientId: this.client.info.wid.user,
          clientName: this.client.info.pushname,
          timestamp: new Date().toISOString(),
        },
      });
    });

    this.client.on("message", async (msg: Message) => {
      try {
        const contact = await msg.getContact();

        // If the message is from the bot itself, respond to /status command
        const botNumber = this.client.info.wid._serialized;
        if (msg.body.trim().toLowerCase() === "/status" && msg.from === botNumber) {
          // Calculate uptime
          const uptimeMs = Date.now() - this.startTime;
          const uptimeSec = Math.floor(uptimeMs / 1000) % 60;
          const uptimeMin = Math.floor(uptimeMs / (1000 * 60)) % 60;
          const uptimeHr = Math.floor(uptimeMs / (1000 * 60 * 60));
          const uptimeStr = `${uptimeHr}h ${uptimeMin}m ${uptimeSec}s`;

          // Excel files
          const files = fs.readdirSync(this.excelDirectory).filter((f) => f.endsWith(".xlsx"));
          const excelCount = files.length;
          const lastExcel = files.sort().reverse()[0] || "N/A";
          const excelPath = this.excelDirectory;

          // Unread messages
          const unread = this.unreadMessages;

          // Status backup files
          const backupFiles = fs.existsSync(this.statusBackupDir)
            ? fs.readdirSync(this.statusBackupDir).filter((f) => f.endsWith(".xlsx"))
            : [];
          const lastBackup = backupFiles.sort().reverse()[0] || "N/A";
          const backupPath = this.statusBackupDir;

          // Reply with status
          await msg.reply(
            `🟢 *WhatsApp Bot Status*\n` +
              `\n*Uptime:* ${uptimeStr}` +
              `\n*Excel files generated:* ${excelCount}` +
              `\n*Last file:* ${lastExcel}` +
              `\n*Excel files location:* ${excelPath}` +
              `\n*Unread messages:* ${unread}` +
              `\n\n*Status Backups:* ${backupFiles.length}` +
              `\n*Last backup:* ${lastBackup}` +
              `\n*Backup location:* ${backupPath}`,
          );
          return;
        }

        // If the message is NOT from the bot, increment unread messages
        if (msg.from !== botNumber) {
          this.unreadMessages++;
        }

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
          {
            customLabel: "WhatsApp",
            context: {
              clientId: this.client.info.wid.user,
              clientName: this.client.info.pushname,
              timestamp: new Date().toISOString(),
            },
          },
        );
      } catch (error) {
        logWithLabel("error", `Error processing message: ${error}`, {
          customLabel: "WhatsApp",
          context: {
            clientId: this.client.info.wid.user,
            clientName: this.client.info.pushname,
            timestamp: new Date().toISOString(),
          },
        });
      }
    });

    this.client.initialize();
  };

  /**
   * Gets the current date as a string in the format "yyyy-MM-dd".
   * @returns The current date string.
   */
  private getCurrentDateString(): string {
    return format(new Date(), "yyyy-MM-dd");
  }

  /**
   * Constructs the file path for the Excel log file based on the current date.
   * @returns The file path for the Excel log.
   */
  private getExcelFilePath(): string {
    return path.join(this.excelDirectory, `messages_${this.currentDate}.xlsx`);
  }

  /**
   * Checks if the date has changed and reinitializes the Excel file if necessary.
   * This ensures daily log rotation.
   */
  private checkDateChange() {
    const today = this.getCurrentDateString();
    if (today !== this.currentDate) {
      this.currentDate = today;
      this.initializeExcelFile();
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
   * Sets up the 'ready' event log.
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
        {
          customLabel: "WhatsApp",
          context: {
            clientId: this.client.info.wid.user,
            clientName: this.client.info.pushname,
            timestamp: new Date().toISOString(),
          },
        },
      );
    });
  };
}
