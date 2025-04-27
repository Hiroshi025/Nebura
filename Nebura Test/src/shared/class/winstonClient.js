"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinstonLogger = void 0;
require("winston-daily-rotate-file");
const fs_1 = __importDefault(require("fs"));
const luxon_1 = require("luxon");
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
/**
 * A logger utility class that wraps the Winston logging library.
 * Provides features such as daily log rotation, log cleanup, and log retrieval.
 */
class WinstonLogger {
    logger;
    logDir;
    maxLogAgeDays;
    /**
     * Creates an instance of WinstonLogger.
     * @param maxLogAgeDays - The maximum age of log files in days before they are deleted. Defaults to 14 days.
     */
    constructor(maxLogAgeDays = 14) {
        this.logDir = path_1.default.resolve("config/logs-apps/proyect");
        this.maxLogAgeDays = maxLogAgeDays;
        this.ensureDirExists();
        winston_1.default.addColors({
            error: "red",
            warn: "yellow",
            info: "green",
            debug: "blue",
            verbose: "cyan",
            http: "magenta",
        });
        this.logger = winston_1.default.createLogger({
            levels: {
                error: 0,
                warn: 1,
                info: 2,
                debug: 3,
                verbose: 4,
                http: 5,
            },
            format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, category }) => {
                return JSON.stringify({
                    timestamp,
                    level,
                    message,
                    category: category || undefined,
                });
            })),
            transports: [
                new winston_1.default.transports.DailyRotateFile({
                    filename: path_1.default.join(this.logDir, "app-%DATE%.log"),
                    datePattern: "YYYY-MM-DD",
                    zippedArchive: true,
                    maxSize: "5m",
                    maxFiles: "14d",
                    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
                }),
            ],
        });
        this.cleanOldLogs();
    }
    /**
     * Ensures that the log directory exists. Creates it if it does not exist.
     */
    ensureDirExists() {
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
    }
    /**
     * Cleans up old log files based on the maximum log age.
     * @returns An object containing the number of deleted and remaining log files.
     */
    cleanOldLogs() {
        const files = fs_1.default.readdirSync(this.logDir);
        const cutoffDate = luxon_1.DateTime.now().minus({ days: this.maxLogAgeDays });
        let deletedCount = 0;
        files.forEach((file) => {
            if (file.match(/app-\d{4}-\d{2}-\d{2}(\.log|\.gz)$/)) {
                const filePath = path_1.default.join(this.logDir, file);
                const stats = fs_1.default.statSync(filePath);
                const fileDate = luxon_1.DateTime.fromJSDate(stats.mtime);
                if (fileDate < cutoffDate) {
                    try {
                        fs_1.default.unlinkSync(filePath);
                        deletedCount++;
                    }
                    catch (error) {
                        this.logger.error(`Error deleting old file: ${file}`, {
                            error: error.message,
                            category: "Logger",
                        });
                    }
                }
            }
        });
        const remainingFiles = files.length - deletedCount;
        return { deleted: deletedCount, remaining: remainingFiles };
    }
    /**
     * Schedules periodic cleanup of old log files.
     * @param intervalHours - The interval in hours at which cleanup should occur. Defaults to 24 hours.
     * @returns A NodeJS.Timeout object representing the scheduled interval.
     */
    scheduleCleanup(intervalHours = 24) {
        return setInterval(() => {
            const result = this.cleanOldLogs();
            this.logger.info(`Automatic cleanup completed. Deleted: ${result.deleted}, Remaining: ${result.remaining}`, {
                category: "Logger",
            });
        }, intervalHours * 60 * 60 * 1000);
    }
    /**
     * Logs an error message.
     * @param message - The error message to log.
     * @param category - An optional category for the log entry.
     */
    error(message, category) {
        this.logger.error(message, { category });
    }
    /**
     * Logs a warning message.
     * @param message - The warning message to log.
     * @param category - An optional category for the log entry.
     */
    warn(message, category) {
        this.logger.warn(message, { category });
    }
    /**
     * Logs an informational message.
     * @param message - The informational message to log.
     * @param category - An optional category for the log entry.
     */
    info(message, category) {
        this.logger.info(message, { category });
    }
    /**
     * Logs a debug message.
     * @param message - The debug message to log.
     * @param category - An optional category for the log entry.
     */
    debug(message, category) {
        this.logger.debug(message, { category });
    }
    /**
     * Logs a verbose message.
     * @param message - The verbose message to log.
     * @param category - An optional category for the log entry.
     */
    verbose(message, category) {
        this.logger.verbose(message, { category });
    }
    /**
     * Logs an HTTP-related message.
     * @param message - The HTTP message to log.
     * @param category - An optional category for the log entry.
     */
    http(message, category) {
        this.logger.log("http", message, { category });
    }
    /**
     * Retrieves recent log files within a specified number of days.
     * @param days - The number of days to look back for log files. Defaults to 7 days.
     * @returns An array of LogFile objects representing the recent log files.
     */
    getRecentLogs(days = 7) {
        try {
            const cutoffDate = luxon_1.DateTime.now().minus({ days });
            return fs_1.default
                .readdirSync(this.logDir)
                .filter((file) => file.match(/app-\d{4}-\d{2}-\d{2}(\.log|\.gz)$/))
                .map((file) => {
                const filePath = path_1.default.join(this.logDir, file);
                const stats = fs_1.default.statSync(filePath);
                const fileDate = luxon_1.DateTime.fromJSDate(stats.mtime);
                return {
                    filename: file,
                    path: filePath,
                    lastModified: fileDate.toISO() || "",
                    size: this.formatSize(stats.size),
                    isCompressed: file.endsWith(".gz"),
                };
            })
                .filter((file) => luxon_1.DateTime.fromISO(file.lastModified) >= cutoffDate)
                .sort((a, b) => b.lastModified.localeCompare(a.lastModified));
        }
        catch (error) {
            this.error(`Error reading records: ${error.message}`, "Logger");
            return [];
        }
    }
    /**
     * Formats a file size in bytes into a human-readable string.
     * @param bytes - The size in bytes.
     * @returns A formatted string representing the size (e.g., "1.23 MB").
     */
    formatSize(bytes) {
        const units = ["B", "KB", "MB", "GB"];
        if (bytes === 0)
            return "0 B";
        const exp = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, exp)).toFixed(2)} ${units[exp]}`;
    }
    /**
     * Reads the content of a specific log file.
     * @param filename - The name of the log file to read.
     * @returns A promise that resolves to an array of log entries.
     */
    async getLogContent(filename) {
        const filePath = path_1.default.join(this.logDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            this.error(`File not found: ${filename}`, "Logger");
            return [];
        }
        try {
            const content = fs_1.default.readFileSync(filePath, "utf-8");
            return content
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => JSON.parse(line));
        }
        catch (error) {
            this.error(`Error reading file: ${error.message}`, "Logger");
            return [];
        }
    }
    /**
     * Prepares log data for API consumption.
     * @param days - The number of days to include in the log data. Defaults to 1 day.
     * @returns An object containing the logs and their statistics.
     */
    prepareForAPI(days = 1) {
        const logs = this.getRecentLogs(days);
        const sizes = logs.map((l) => {
            const sizeStr = l.size.replace(/[^\d.]/g, "");
            return (parseFloat(sizeStr) * (l.size.includes("KB") ? 1024 : l.size.includes("MB") ? 1024 ** 2 : 1));
        });
        const totalSize = sizes.reduce((sum, size) => sum + size, 0);
        return {
            logs,
            stats: {
                total: logs.length,
                totalSize: this.formatSize(totalSize),
                oldest: logs[logs.length - 1]?.lastModified || null,
                newest: logs[0]?.lastModified || null,
            },
        };
    }
}
exports.WinstonLogger = WinstonLogger;
