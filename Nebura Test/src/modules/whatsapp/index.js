"use strict";
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
const config_1 = require("../../shared/utils/config");
const console_1 = require("../../shared/utils/functions/console");
const emojis_json_1 = __importDefault(require("../../../config/json/emojis.json"));
//const store = new PrismaStore();
/**
 * Represents the WhatsApp module for handling interactions and functionalities.
 */
class MyApp {
    /**
     * Instance of the WhatsApp client.
     */
    client;
    /**
     * Directory where Excel logs are stored.
     */
    excelDirectory;
    /**
     * Current date string used for log file naming.
     */
    currentDate;
    /**
     * Instance of the ExcelJS workbook.
     */
    workbook;
    /**
     * Instance of the ExcelJS worksheet.
     */
    worksheet;
    /**
     * Initializes the WhatsApp module and sets up the Excel logging system.
     */
    constructor() {
        this.excelDirectory = path_1.default.join(config_1.config.project.logs, "whatsapp", "chats");
        this.currentDate = this.getCurrentDateString();
        this.initializeExcelFile();
    }
    /**
     * Initializes the WhatsApp client and sets up event listeners.
     */
    InitClient = async () => {
        this.client = new whatsapp_web_js_1.Client({
            /*       authStrategy: new RemoteAuth({
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
            (0, console_1.logWithLabel)("custom", "QR RECEIVED. PLEASE SCAN", "WhatsApp");
            qrcode_terminal_1.default.generate(qr, { small: true });
        });
        this.client.on("authenticated", () => {
            (0, console_1.logWithLabel)("custom", "AUTHENTICATED. The session is ready to be used.", "WhatsApp");
            (0, console_1.logWithLabel)("custom", "Registered Client on the Web", "WhatsApp");
        });
        this.client.on("message", async (msg) => {
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
                (0, console_1.logWithLabel)("info", `[${new Date().toLocaleTimeString()}] Message from ${messageData.sender}: ${messageData.message.substring(0, 30)}${messageData.message.length > 30 ? "..." : ""}`, "WhatsApp");
            }
            catch (error) {
                (0, console_1.logWithLabel)("error", `Error processing message: ${error}`, "WhatsApp");
            }
        });
        this.client.initialize();
    };
    /**
     * Gets the current date as a string in the format "yyyy-MM-dd".
     * @returns {string} The current date string.
     */
    getCurrentDateString() {
        return (0, date_fns_1.format)(new Date(), "yyyy-MM-dd");
    }
    /**
     * Constructs the file path for the Excel log file based on the current date.
     * @returns {string} The file path for the Excel log.
     */
    getExcelFilePath() {
        return path_1.default.join(this.excelDirectory, `messages_${this.currentDate}.xlsx`);
    }
    /**
     * Checks if the date has changed and reinitializes the Excel file if necessary.
     */
    checkDateChange() {
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
    ensureDirectoryExists() {
        if (!fs_1.default.existsSync(this.excelDirectory)) {
            fs_1.default.mkdirSync(this.excelDirectory, { recursive: true });
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
     */
    start = async () => {
        this.InitClient();
        this.client.on("ready", () => {
            (0, console_1.logWithLabel)("custom", [
                "Client is ready!",
                `  ${emojis_json_1.default.info}  ${chalk_1.default.gray("The WhatsApp API module has started.")}`,
            ].join("\n"), "WhatsApp");
        });
    };
}
exports.MyApp = MyApp;
