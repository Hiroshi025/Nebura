import fs from "fs-extra";
import schedule, { Job } from "node-schedule";
import path from "path";

import { PrismaError } from "@/shared/adapters/extends/error.extend";
import { PrismaClient } from "@prisma/client";
import { config } from "@utils/config";
import { logWithLabel } from "@utils/functions/console";

/**
 * Service for managing database backups.
 * Provides functionality to create, list, retrieve, delete, and schedule backups.
 */
export const Backups = class BackupService {
  private prisma: PrismaClient;
  private backupDir: string;
  private job: Job | null;

  /**
   * Initializes a new instance of the BackupService.
   * @param backupDir - The directory where backups will be stored. Defaults to a `backups` folder in the current directory.
   */
  constructor(backupDir: string = path.join(__dirname, config.tasks.backups.path)) {
    this.prisma = new PrismaClient();
    this.backupDir = backupDir;
    this.job = null;
    console.info(`[BackupService] Initialized with backup directory: ${this.backupDir}`);
  }

  private isValidFileName(fileName: string): boolean {
    // Solo permite nombres de archivo simples terminados en .json
    return /^[\w\-]+(\.[\w\-]+)*\.json$/.test(fileName);
  }

  /**
   * Ensures that the backup directory exists. Creates it if it does not exist.
   * @private
   */
  private async ensureBackupDir() {
    console.debug(`[BackupService] Ensuring backup directory exists: ${this.backupDir}`);
    await fs.ensureDir(this.backupDir);
  }

  /**
   * Dynamically retrieves all models from the Prisma client.
   * @returns A promise that resolves to an array of model names.
   * @private
   */
  private async getAllModels(): Promise<string[]> {
    const models = Object.keys(this.prisma).filter(
      (key) => typeof (this.prisma as any)[key]?.findMany === "function",
    ) as string[];
    console.debug(`[BackupService] Prisma models detected: ${models.join(", ")}`);
    return models;
  }

  /**
   * Creates a backup of all database models and saves it as a JSON file in the backup directory.
   * The backup file is named with a timestamp.
   * @returns A promise that resolves when the backup is complete.
   */
  public async createBackup(): Promise<void> {
    console.info(`[BackupService] Starting backup process...`);
    console.time("[BackupService] BackupDuration");
    try {
      await this.ensureBackupDir();

      const models = await this.getAllModels();
      const backupData: Record<string, any[]> = {};

      for (const model of models) {
        console.debug(`[BackupService] Fetching data from model: ${model}`);
        backupData[model] = await (this.prisma as any)[model].findMany();
        console.debug(`[BackupService] Model ${model} fetched: ${backupData[model].length} records`);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);

      console.debug(`[BackupService] Writing backup file: ${backupFile}`);
      await fs.writeJson(backupFile, backupData, { spaces: 2 });

      console.info(`[BackupService] Backup completed successfully: ${backupFile}`);
    } catch (error: any) {
      console.error(`[BackupService] Error during backup: ${error.message}`);
      console.trace(error);
      throw error;
    } finally {
      console.timeEnd("[BackupService] BackupDuration");
    }
  }

  /**
   * Lists all backup files in the backup directory.
   * @returns A promise that resolves to an array of backup file names.
   */
  public async listBackups(): Promise<string[]> {
    console.debug(`[BackupService] Listing backup files in: ${this.backupDir}`);
    await this.ensureBackupDir();
    const files = await fs.readdir(this.backupDir);
    return files.filter((file) => file.endsWith(".json"));
  }

  /**
   * Retrieves the contents of a specific backup file by its name.
   * @param fileName - The name of the backup file to retrieve.
   * @returns A promise that resolves to the contents of the backup file.
   * @throws {PrismaError} If the backup file does not exist.
   */
  public async findBackupById(fileName: string): Promise<any> {
    if (!this.isValidFileName(fileName)) {
      throw new PrismaError(`Invalid backup file name: ${fileName}`);
    }
    const filePath = path.join(this.backupDir, fileName);
    console.debug(`[BackupService] Retrieving backup file: ${filePath}`);
    if (await fs.pathExists(filePath)) {
      const data = await fs.readJson(filePath);
      console.info(`[BackupService] Backup file ${fileName} loaded`);
      return data;
    } else {
      console.error(`[BackupService] Backup file not found: ${fileName}`);
      throw new PrismaError(`Backup ${fileName} not found.`);
    }
  }

  /**
   * Deletes a specific backup file by its name.
   * @param fileName - The name of the backup file to delete.
   * @returns A promise that resolves when the backup file is deleted.
   * @throws {PrismaError} If the backup file does not exist.
   */
  public async deleteBackup(fileName: string): Promise<void> {
    if (!this.isValidFileName(fileName)) {
      throw new PrismaError(`Invalid backup file name: ${fileName}`);
    }
    const filePath = path.join(this.backupDir, fileName);
    console.debug(`[BackupService] Deleting backup file: ${filePath}`);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      console.info(`[BackupService] Backup file deleted: ${fileName}`);
    } else {
      console.error(`[BackupService] Backup file not found for deletion: ${fileName}`);
      throw new PrismaError(`Backup ${fileName} not found.`);
    }
  }

  /**
   * Schedules automatic backups using a cron expression.
   * @param cronExpression - The cron expression defining the backup schedule. Defaults to '0 2 * * *' (daily at 2 AM).
   */

  // en un minuto
  public scheduleBackups(cronExpression: string = config.tasks.backups.cron): void {
    if (this.job) {
      this.job.cancel();
      console.info(`[BackupService] Previous backup job cancelled`);
    }
    this.job = schedule.scheduleJob(cronExpression, async () => {
      console.info(`[BackupService] Scheduled backup triggered`);
      try {
        await this.createBackup();
      } catch (error: any) {
        logWithLabel("error", `Scheduled backup failed: ${error.message}`);
      }
    });
    // --- RECOMENDACIÓN 4: Usar nivel de log adecuado ---
    logWithLabel(
      "info",
      [
        "Backups scheduled with cron expression.",
        `Next backup: ${this.job.nextInvocation()}`,
        `Cron expression: ${cronExpression}`,
      ].join("\n"),
    );
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    console.info(`[BackupService] PrismaClient disconnected.`);
  }
};
