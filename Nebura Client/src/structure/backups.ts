import fs from "fs-extra";
import schedule, { Job } from "node-schedule";
import path from "path";

import { PrismaError } from "@extenders/errors.extender";
import { PrismaClient } from "@prisma/client";
import { logWithLabel } from "@utils/functions/console";

/**
 * Service for managing database backups.
 * Provides functionality to create, list, retrieve, delete, and schedule backups.
 */
export class BackupService {
  private prisma: PrismaClient;
  private backupDir: string;
  private job: Job | null;

  /**
   * Initializes a new instance of the BackupService.
   * @param backupDir - The directory where backups will be stored. Defaults to a `backups` folder in the current directory.
   */
  constructor(backupDir: string = path.join(__dirname, "../../config/backups")) {
    this.prisma = new PrismaClient();
    this.backupDir = backupDir;
    this.job = null;
  }

  // --- RECOMENDACIÓN 1: Validar nombre de archivo para evitar path traversal ---
  private isValidFileName(fileName: string): boolean {
    // Solo permite nombres de archivo simples terminados en .json
    return /^[\w\-]+(\.[\w\-]+)*\.json$/.test(fileName);
  }

  /**
   * Ensures that the backup directory exists. Creates it if it does not exist.
   * @private
   */
  private async ensureBackupDir() {
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
    return models;
  }

  /**
   * Creates a backup of all database models and saves it as a JSON file in the backup directory.
   * The backup file is named with a timestamp.
   * @returns A promise that resolves when the backup is complete.
   */
  public async createBackup(): Promise<void> {
    try {
      logWithLabel("debug", "Starting the backup process...");

      await this.ensureBackupDir();

      const models = await this.getAllModels();
      const backupData: Record<string, any[]> = {};

      for (const model of models) {
        logWithLabel("debug", `Fetching data from model: ${model}`);
        backupData[model] = await (this.prisma as any)[model].findMany();
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);

      await fs.writeJson(backupFile, backupData, { spaces: 2 });

      logWithLabel("debug", `Backup completed: ${backupFile}`);
    } catch (error: any) {
      logWithLabel("error", `Error during the backup process: ${error.message}`);
      // --- RECOMENDACIÓN 2: Propagar el error si se requiere manejo externo ---
      throw error;
    }
  }

  /**
   * Lists all backup files in the backup directory.
   * @returns A promise that resolves to an array of backup file names.
   */
  public async listBackups(): Promise<string[]> {
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
    // --- RECOMENDACIÓN 3: Validar nombre de archivo ---
    if (!this.isValidFileName(fileName)) {
      throw new PrismaError(`Invalid backup file name: ${fileName}`);
    }
    const filePath = path.join(this.backupDir, fileName);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    } else {
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
    // --- RECOMENDACIÓN 3: Validar nombre de archivo ---
    if (!this.isValidFileName(fileName)) {
      throw new PrismaError(`Invalid backup file name: ${fileName}`);
    }
    const filePath = path.join(this.backupDir, fileName);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      logWithLabel("debug", `Backup ${fileName} deleted.`);
    } else {
      throw new PrismaError(`Backup ${fileName} not found.`);
    }
  }

  /**
   * Schedules automatic backups using a cron expression.
   * @param cronExpression - The cron expression defining the backup schedule. Defaults to '0 2 * * *' (daily at 2 AM).
   */

  // en un minuto
  public scheduleBackups(cronExpression: string = "0 2 * * *"): void { 
    if (this.job) {
      this.job.cancel();
    }
    this.job = schedule.scheduleJob(cronExpression, async () => {
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

  // --- RECOMENDACIÓN 5: Método para cerrar PrismaClient ---
  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    logWithLabel("debug", "PrismaClient disconnected.");
  }
}
