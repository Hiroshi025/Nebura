import "winston-daily-rotate-file";

import fs from "fs";
import { DateTime } from "luxon";
import path from "path";
import winston, { LogEntry } from "winston";

import { LogFile } from "@/typings/utils";

export class WinstonLogger {
  private logger: winston.Logger;
  private logDir: string;
  private maxLogAgeDays: number; // Default value for maximum log age in days

  constructor(maxLogAgeDays: number = 14) {
    this.logDir = path.resolve(process.env.WINSTON_LOG_DIR as string);
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
          return JSON.stringify({
            timestamp,
            level,
            message,
            category: category || undefined,
          });
        }),
      ),
      transports: [
        // Transporte con rotación diaria
        new winston.transports.DailyRotateFile({
          filename: path.join(this.logDir, "app-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "5m",
          maxFiles: "14d",
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
    });

    this.cleanOldLogs();
  }

  private ensureDirExists(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  public cleanOldLogs(): { deleted: number; remaining: number } {
    const files = fs.readdirSync(this.logDir);
    const cutoffDate = DateTime.now().minus({ days: this.maxLogAgeDays });
    let deletedCount = 0;

    files.forEach((file) => {
      // Solo procesar archivos de log (incluyendo comprimidos)
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

  public scheduleCleanup(intervalHours: number = 24): NodeJS.Timeout {
    return setInterval(
      () => {
        const result = this.cleanOldLogs();
        this.logger.info(
          `Automatic cleanup completed. Deleted: ${result.deleted}, Remaining: ${result.remaining}`,
          {
            category: "Logger",
          },
        );
      },
      intervalHours * 60 * 60 * 1000,
    );
  }

  // Métodos de logging
  public error(message: string, category?: string): void {
    this.logger.error(message, { category });
  }

  public warn(message: string, category?: string): void {
    this.logger.warn(message, { category });
  }

  public info(message: string, category?: string): void {
    this.logger.info(message, { category });
  }

  public debug(message: string, category?: string): void {
    this.logger.debug(message, { category });
  }

  public verbose(message: string, category?: string): void {
    this.logger.verbose(message, { category });
  }

  public http(message: string, category?: string): void {
    this.logger.log("http", message, { category });
  }

  // Métodos para manejo de archivos
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

  private formatSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const exp = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, exp)).toFixed(2)} ${units[exp]}`;
  }

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
