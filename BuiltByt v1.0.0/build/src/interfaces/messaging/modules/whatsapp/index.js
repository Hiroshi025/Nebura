"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="1a3f236e-0d36-55f2-b45d-4ec33e364d08")}catch(e){}}();

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyApp = void 0;
const chalk_1 = __importDefault(require("chalk"));
const date_fns_1 = require("date-fns");
const ExcelJS = __importStar(require("exceljs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const whatsapp_web_js_1 = require("whatsapp-web.js");
const config_1 = require("../../../../shared/utils/config");
const console_1 = require("../../../../shared/utils/functions/console");
const emojis_json_1 = __importDefault(require("../../../../../config/json/emojis.json"));
/**
 * Represents the WhatsApp module for handling interactions, logging, and statistics.
 *
 * - Logs all incoming messages to daily Excel files.
 * - Provides a private `/status` command for the bot number to get runtime statistics.
 * - Generates a daily Excel backup with client and chat statistics.
 */
class MyApp {
    /**
     * Instance of the WhatsApp client.
     */
    client;
    /**
     * Directory where chat Excel logs are stored.
     */
    excelDirectory;
    /**
     * Current date string used for log file naming.
     */
    currentDate;
    /**
     * Instance of the ExcelJS workbook for chat logs.
     */
    workbook;
    /**
     * Instance of the ExcelJS worksheet for chat logs.
     */
    worksheet;
    /**
     * Timestamp (ms) when the client started.
     */
    startTime;
    /**
     * Counter for unread messages since the last status check.
     */
    unreadMessages;
    /**
     * Directory where status backup Excel files are stored.
     */
    statusBackupDir;
    /**
     * Initializes the WhatsApp module, directories, and schedules status backups.
     *
     * @remarks
     * - Ensures all required directories exist.
     * - Initializes the daily Excel log file.
     * - Schedules the daily status backup.
     */
    constructor() {
        this.excelDirectory = path_1.default.join(config_1.config.project.logs, "whatsapp", "chats");
        this.currentDate = this.getCurrentDateString();
        this.startTime = Date.now();
        this.unreadMessages = 0;
        this.statusBackupDir = path_1.default.resolve("./config/backups/whatsapp");
        this.ensureDirectoryExists();
        this.ensureStatusBackupDirExists();
        this.initializeExcelFile();
        this.scheduleStatusBackup();
    }
    /**
     * Ensures that the directory for storing status backups exists.
     * If it does not exist, it creates the directory.
     */
    ensureStatusBackupDirExists() {
        if (!fs_1.default.existsSync(this.statusBackupDir)) {
            fs_1.default.mkdirSync(this.statusBackupDir, { recursive: true });
        }
    }
    /**
     * Ensures that the directory for storing chat Excel logs exists.
     * If it does not exist, it creates the directory.
     */
    ensureDirectoryExists() {
        if (!fs_1.default.existsSync(this.excelDirectory)) {
            fs_1.default.mkdirSync(this.excelDirectory, { recursive: true });
        }
    }
    /**
     * Schedules the status backup to run every 24 hours.
     * The backup is also generated immediately on startup.
     */
    scheduleStatusBackup() {
        // Generate immediately on startup
        this.generateStatusBackup();
        // Log when scheduling the interval
        (0, console_1.logWithLabel)("custom", "Scheduled WhatsApp status backup every 24 hours.", {
            customLabel: "WhatsApp"
        });
        setInterval(async () => {
            (0, console_1.logWithLabel)("custom", "Generating scheduled WhatsApp status backup...", {
                customLabel: "WhatsApp"
            });
            await this.generateStatusBackup();
        }, 24 * 60 * 60 * 1000);
    }
    /**
     * Generates a status backup Excel file with client and chat Excel statistics.
     * The backup includes uptime, Excel file stats, unread messages, and a list of chat log files.
     * The backup is saved in the status backup directory.
     */
    async generateStatusBackup() {
        // Solo generar backup si la variable de entorno está activada
        if (process.env.WHATSAPP_BACKUPS !== "true") {
            return;
        }
        this.ensureStatusBackupDirExists();
        const now = new Date();
        const backupFileName = `status_${(0, date_fns_1.format)(now, "yyyy-MM-dd_HH-mm-ss")}.xlsx`;
        const backupFilePath = path_1.default.join(this.statusBackupDir, backupFileName);
        // Gather stats
        const uptimeMs = Date.now() - this.startTime;
        const uptimeSec = Math.floor(uptimeMs / 1000) % 60;
        const uptimeMin = Math.floor(uptimeMs / (1000 * 60)) % 60;
        const uptimeHr = Math.floor(uptimeMs / (1000 * 60 * 60));
        const uptimeStr = `${uptimeHr}h ${uptimeMin}m ${uptimeSec}s`;
        const files = fs_1.default.existsSync(this.excelDirectory)
            ? fs_1.default.readdirSync(this.excelDirectory).filter((f) => f.endsWith(".xlsx"))
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
    InitClient = async () => {
        this.client = new whatsapp_web_js_1.Client({
            /*authStrategy: new RemoteAuth({
              store: store,
              backupSyncIntervalMs: 60000,
              dataPath: path.join(config.project.logs, "whatsapp"),
            }), */
            authStrategy: new whatsapp_web_js_1.LocalAuth(),
            puppeteer: {
                headless: true,
                args: ["--no-sandbox"],
            },
        });
        this.client.on("qr", (qr) => {
            (0, console_1.logWithLabel)("custom", "QR RECEIVED. PLEASE SCAN", {
                customLabel: "WhatsApp",
                context: {
                    clientId: this.client.info.wid.user,
                    clientName: this.client.info.pushname,
                    timestamp: new Date().toISOString(),
                },
            });
            qrcode_terminal_1.default.generate(qr, { small: true });
        });
        this.client.on("authenticated", () => {
            (0, console_1.logWithLabel)("custom", "AUTHENTICATED. The session is ready to be used.", {
                customLabel: "WhatsApp",
            });
            (0, console_1.logWithLabel)("custom", "Registered Client on the Web", {
                customLabel: "WhatsApp",
            });
        });
        this.client.on("message", async (msg) => {
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
                    const files = fs_1.default.readdirSync(this.excelDirectory).filter((f) => f.endsWith(".xlsx"));
                    const excelCount = files.length;
                    const lastExcel = files.sort().reverse()[0] || "N/A";
                    const excelPath = this.excelDirectory;
                    // Unread messages
                    const unread = this.unreadMessages;
                    // Status backup files
                    const backupFiles = fs_1.default.existsSync(this.statusBackupDir)
                        ? fs_1.default.readdirSync(this.statusBackupDir).filter((f) => f.endsWith(".xlsx"))
                        : [];
                    const lastBackup = backupFiles.sort().reverse()[0] || "N/A";
                    const backupPath = this.statusBackupDir;
                    // Reply with status
                    await msg.reply(`🟢 *WhatsApp Bot Status*\n` +
                        `\n*Uptime:* ${uptimeStr}` +
                        `\n*Excel files generated:* ${excelCount}` +
                        `\n*Last file:* ${lastExcel}` +
                        `\n*Excel files location:* ${excelPath}` +
                        `\n*Unread messages:* ${unread}` +
                        `\n\n*Status Backups:* ${backupFiles.length}` +
                        `\n*Last backup:* ${lastBackup}` +
                        `\n*Backup location:* ${backupPath}`);
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
                (0, console_1.logWithLabel)("info", `[${new Date().toLocaleTimeString()}] Message from ${messageData.sender}: ${messageData.message.substring(0, 30)}${messageData.message.length > 30 ? "..." : ""}`, {
                    customLabel: "WhatsApp",
                    context: {
                        clientId: this.client.info.wid.user,
                        clientName: this.client.info.pushname,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
            catch (error) {
                (0, console_1.logWithLabel)("error", `Error processing message: ${error}`, {
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
    getCurrentDateString() {
        return (0, date_fns_1.format)(new Date(), "yyyy-MM-dd");
    }
    /**
     * Constructs the file path for the Excel log file based on the current date.
     * @returns The file path for the Excel log.
     */
    getExcelFilePath() {
        return path_1.default.join(this.excelDirectory, `messages_${this.currentDate}.xlsx`);
    }
    /**
     * Checks if the date has changed and reinitializes the Excel file if necessary.
     * This ensures daily log rotation.
     */
    checkDateChange() {
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
    initializeExcelFile = async () => {
        this.ensureDirectoryExists();
        const filePath = this.getExcelFilePath();
        this.workbook = new ExcelJS.Workbook();
        if (fs_1.default.existsSync(filePath)) {
            await this.workbook.xlsx.readFile(filePath);
            this.worksheet =
                this.workbook.getWorksheet("Messages") || this.workbook.addWorksheet("Messages");
        }
        else {
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
    saveToExcel = async (messageData) => {
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
    start = async () => {
        this.InitClient();
        this.client.on("ready", () => {
            (0, console_1.logWithLabel)("custom", [
                "Client is ready!",
                `  ${emojis_json_1.default.info}  ${chalk_1.default.gray("The WhatsApp API module has started.")}`,
            ].join("\n"), {
                customLabel: "WhatsApp",
            });
        });
    };
}
exports.MyApp = MyApp;
//# sourceMappingURL=index.js.map
//# debugId=1a3f236e-0d36-55f2-b45d-4ec33e364d08
