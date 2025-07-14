import "winston-daily-rotate-file";

import fs from "fs";
import { DateTime } from "luxon";
import path from "path";
import winston, { LogEntry } from "winston";

import { LogFile } from "@/typings/utils";

import { logWithLabel } from "./functions/console";

/**
 * A logger utility class that wraps the Winston logging library.
 * Provides features such as daily log rotation, log cleanup, and log retrieval.
 */
export class WinstonLogger {
  private logger: winston.Logger;
  public logDir: string;
  public maxLogAgeDays: number;

  /**
   * Creates an instance of WinstonLogger.
   * @param maxLogAgeDays - The maximum age of log files in days before they are deleted. Defaults to 14 days.
   */
  constructor(maxLogAgeDays: number = 14) {
    this.logDir = path.resolve(
      process.env.WINSTON_LOG_DIR ? process.env.WINSTON_LOG_DIR : "./config/logs-apps/proyect",
    );
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.maxLogAgeDays = maxLogAgeDays;
    this.ensureDirExists();

    winston.addColors({
      error: "red",
      warn: "yellow",
      info: "green",
      debug: "blue",
      verbose: "cyan",
      http: "magenta",
    });

    this.logger = winston.createLogger({
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        verbose: 4,
        http: 5,
      },
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, category }) => {
          // Formato típico de log: [fecha] [nivel] [categoría] mensaje
          return `[${timestamp}] [${level}]${category ? ` [${category}]` : ""} ${message}`;
        }),
      ),
      transports: [
        new winston.transports.DailyRotateFile({
          filename: path.join(this.logDir, "app-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "5m",
          maxFiles: "14d",
          // Cambia el formato del archivo .log a texto plano
          format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
            winston.format.printf(({ timestamp, level, message, category }) => {
              return `[${timestamp}] [${level}]${category ? ` [${category}]` : ""} ${message}`;
            }),
          ),
        }),
      ],
    });

    this.cleanOldLogs();
  }

  /**
   * Ensures that the log directory exists. Creates it if it does not exist.
   */
  private ensureDirExists(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Cleans up old log files based on the maximum log age.
   * @returns An object containing the number of deleted and remaining log files.
   */
  public cleanOldLogs(): { deleted: number; remaining: number } {
    const files = fs.readdirSync(this.logDir);
    const cutoffDate = DateTime.now().minus({ days: this.maxLogAgeDays });
    let deletedCount = 0;

    files.forEach((file) => {
      if (file.match(/app-\d{4}-\d{2}-\d{2}(\.log|\.gz)$/)) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const fileDate = DateTime.fromJSDate(stats.mtime);

        if (fileDate < cutoffDate) {
          try {
            fs.unlinkSync(filePath);
            deletedCount++;
          } catch (error) {
            this.logger.error(`Error deleting old file: ${file}`, {
              error: (error as Error).message,
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
  public scheduleCleanup(intervalHours: number = 24): NodeJS.Timeout {
    return setInterval(
      () => {
        const result = this.cleanOldLogs();
        logWithLabel("custom", [
          `Old logs cleanup completed: ${result.deleted} files deleted, ${result.remaining} files remaining.`,
          `Log directory: ${this.logDir}`,
          `Max log age: ${this.maxLogAgeDays} days`,
        ].join("\n"), {
          customLabel: "Logger",
        })
      },
      intervalHours * 60 * 60 * 1000,
    );
  }

  /**
   * Logs an error message.
   * @param message - The error message to log.
   * @param category - An optional category for the log entry.
   */
  public error(message: string, category?: string): void {
    this.logger.error(message, { category });
  }

  /**
   * Logs a warning message.
   * @param message - The warning message to log.
   * @param category - An optional category for the log entry.
   */
  public warn(message: string, category?: string): void {
    this.logger.warn(message, { category });
  }

  /**
   * Logs an informational message.
   * @param message - The informational message to log.
   * @param category - An optional category for the log entry.
   */
  public info(message: string, category?: string): void {
    this.logger.info(message, { category });
  }

  /**
   * Logs a debug message.
   * @param message - The debug message to log.
   * @param category - An optional category for the log entry.
   */
  public debug(message: string, category?: string): void {
    this.logger.debug(message, { category });
  }

  /**
   * Logs a verbose message.
   * @param message - The verbose message to log.
   * @param category - An optional category for the log entry.
   */
  public verbose(message: string, category?: string): void {
    this.logger.verbose(message, { category });
  }

  /**
   * Logs an HTTP-related message.
   * @param message - The HTTP message to log.
   * @param category - An optional category for the log entry.
   */
  public http(message: string, category?: string): void {
    this.logger.log("http", message, { category });
  }

  /**
   * Retrieves recent log files within a specified number of days.
   * @param days - The number of days to look back for log files. Defaults to 7 days.
   * @returns An array of LogFile objects representing the recent log files.
   */
  public getRecentLogs(days: number = 7): LogFile[] {
    try {
      const cutoffDate = DateTime.now().minus({ days });

      return fs
        .readdirSync(this.logDir)
        .filter((file) => file.match(/app-\d{4}-\d{2}-\d{2}(\.log|\.gz)$/))
        .map((file) => {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          const fileDate = DateTime.fromJSDate(stats.mtime);

          return {
            filename: file,
            path: filePath,
            lastModified: fileDate.toISO() || "",
            size: this.formatSize(stats.size),
            isCompressed: file.endsWith(".gz"),
          };
        })
        .filter((file) => DateTime.fromISO(file.lastModified) >= cutoffDate)
        .sort((a, b) => b.lastModified.localeCompare(a.lastModified));
    } catch (error) {
      this.error(`Error reading records: ${(error as Error).message}`, "Logger");
      return [];
    }
  }

  /**
   * Formats a file size in bytes into a human-readable string.
   * @param bytes - The size in bytes.
   * @returns A formatted string representing the size (e.g., "1.23 MB").
   */
  private formatSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const exp = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, exp)).toFixed(2)} ${units[exp]}`;
  }

  /**
   * Reads the content of a specific log file.
   * @param filename - The name of the log file to read.
   * @returns A promise that resolves to an array of log entries.
   */
  public async getLogContent(filename: string): Promise<LogEntry[]> {
    const filePath = path.join(this.logDir, filename);

    if (!fs.existsSync(filePath)) {
      this.error(`File not found: ${filename}`, "Logger");
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
    } catch (error) {
      this.error(`Error reading file: ${(error as Error).message}`, "Logger");
      return [];
    }
  }

  /**
   * Prepares log data for API consumption.
   * @param days - The number of days to include in the log data. Defaults to 1 day.
   * @returns An object containing the logs and their statistics.
   */
  public prepareForAPI(days: number = 1): {
    logs: LogFile[];
    stats: {
      total: number;
      totalSize: string;
      oldest: string | null;
      newest: string | null;
    };
  } {
    const logs = this.getRecentLogs(days);
    const sizes = logs.map((l) => {
      const sizeStr = l.size.replace(/[^\d.]/g, "");
      return (
        parseFloat(sizeStr) * (l.size.includes("KB") ? 1024 : l.size.includes("MB") ? 1024 ** 2 : 1)
      );
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
