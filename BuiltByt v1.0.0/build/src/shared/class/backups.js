"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="308845e9-91e5-5fd6-beb8-4ab2e6103806")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Backups = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const path_1 = __importDefault(require("path"));
const error_extend_1 = require("../../shared/adapters/extends/error.extend");
const client_1 = require("@prisma/client");
const config_1 = require("../utils/config");
const console_1 = require("../utils/functions/console");
/**
 * Service for managing database backups.
 * Provides functionality to create, list, retrieve, delete, and schedule backups.
 */
const Backups = class BackupService {
    prisma;
    backupDir;
    job;
    /**
     * Initializes a new instance of the BackupService.
     * @param backupDir - The directory where backups will be stored. Defaults to a `backups` folder in the current directory.
     */
    constructor(backupDir = path_1.default.join(__dirname, config_1.config.tasks.backups.path)) {
        this.prisma = new client_1.PrismaClient();
        this.backupDir = backupDir;
        this.job = null;
        console.info(`[BackupService] Initialized with backup directory: ${this.backupDir}`);
    }
    isValidFileName(fileName) {
        // Solo permite nombres de archivo simples terminados en .json
        return /^[\w\-]+(\.[\w\-]+)*\.json$/.test(fileName);
    }
    /**
     * Ensures that the backup directory exists. Creates it if it does not exist.
     * @private
     */
    async ensureBackupDir() {
        console.debug(`[BackupService] Ensuring backup directory exists: ${this.backupDir}`);
        await fs_extra_1.default.ensureDir(this.backupDir);
    }
    /**
     * Dynamically retrieves all models from the Prisma client.
     * @returns A promise that resolves to an array of model names.
     * @private
     */
    async getAllModels() {
        const models = Object.keys(this.prisma).filter((key) => typeof this.prisma[key]?.findMany === "function");
        console.debug(`[BackupService] Prisma models detected: ${models.join(", ")}`);
        return models;
    }
    /**
     * Creates a backup of all database models and saves it as a JSON file in the backup directory.
     * The backup file is named with a timestamp.
     * @returns A promise that resolves when the backup is complete.
     */
    async createBackup() {
        console.info(`[BackupService] Starting backup process...`);
        console.time("[BackupService] BackupDuration");
        try {
            await this.ensureBackupDir();
            const models = await this.getAllModels();
            const backupData = {};
            for (const model of models) {
                console.debug(`[BackupService] Fetching data from model: ${model}`);
                backupData[model] = await this.prisma[model].findMany();
                console.debug(`[BackupService] Model ${model} fetched: ${backupData[model].length} records`);
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupFile = path_1.default.join(this.backupDir, `backup-${timestamp}.json`);
            console.debug(`[BackupService] Writing backup file: ${backupFile}`);
            await fs_extra_1.default.writeJson(backupFile, backupData, { spaces: 2 });
            console.info(`[BackupService] Backup completed successfully: ${backupFile}`);
        }
        catch (error) {
            console.error(`[BackupService] Error during backup: ${error.message}`);
            console.trace(error);
            throw error;
        }
        finally {
            console.timeEnd("[BackupService] BackupDuration");
        }
    }
    /**
     * Lists all backup files in the backup directory.
     * @returns A promise that resolves to an array of backup file names.
     */
    async listBackups() {
        console.debug(`[BackupService] Listing backup files in: ${this.backupDir}`);
        await this.ensureBackupDir();
        const files = await fs_extra_1.default.readdir(this.backupDir);
        return files.filter((file) => file.endsWith(".json"));
    }
    /**
     * Retrieves the contents of a specific backup file by its name.
     * @param fileName - The name of the backup file to retrieve.
     * @returns A promise that resolves to the contents of the backup file.
     * @throws {PrismaError} If the backup file does not exist.
     */
    async findBackupById(fileName) {
        if (!this.isValidFileName(fileName)) {
            throw new error_extend_1.PrismaError(`Invalid backup file name: ${fileName}`);
        }
        const filePath = path_1.default.join(this.backupDir, fileName);
        console.debug(`[BackupService] Retrieving backup file: ${filePath}`);
        if (await fs_extra_1.default.pathExists(filePath)) {
            const data = await fs_extra_1.default.readJson(filePath);
            console.info(`[BackupService] Backup file ${fileName} loaded`);
            return data;
        }
        else {
            console.error(`[BackupService] Backup file not found: ${fileName}`);
            throw new error_extend_1.PrismaError(`Backup ${fileName} not found.`);
        }
    }
    /**
     * Deletes a specific backup file by its name.
     * @param fileName - The name of the backup file to delete.
     * @returns A promise that resolves when the backup file is deleted.
     * @throws {PrismaError} If the backup file does not exist.
     */
    async deleteBackup(fileName) {
        if (!this.isValidFileName(fileName)) {
            throw new error_extend_1.PrismaError(`Invalid backup file name: ${fileName}`);
        }
        const filePath = path_1.default.join(this.backupDir, fileName);
        console.debug(`[BackupService] Deleting backup file: ${filePath}`);
        if (await fs_extra_1.default.pathExists(filePath)) {
            await fs_extra_1.default.remove(filePath);
            console.info(`[BackupService] Backup file deleted: ${fileName}`);
        }
        else {
            console.error(`[BackupService] Backup file not found for deletion: ${fileName}`);
            throw new error_extend_1.PrismaError(`Backup ${fileName} not found.`);
        }
    }
    /**
     * Schedules automatic backups using a cron expression.
     * @param cronExpression - The cron expression defining the backup schedule. Defaults to '0 2 * * *' (daily at 2 AM).
     */
    // en un minuto
    scheduleBackups(cronExpression = config_1.config.tasks.backups.cron) {
        if (this.job) {
            this.job.cancel();
            console.info(`[BackupService] Previous backup job cancelled`);
        }
        this.job = node_schedule_1.default.scheduleJob(cronExpression, async () => {
            console.info(`[BackupService] Scheduled backup triggered`);
            try {
                await this.createBackup();
            }
            catch (error) {
                (0, console_1.logWithLabel)("error", `Scheduled backup failed: ${error.message}`);
            }
        });
        // --- RECOMENDACIÓN 4: Usar nivel de log adecuado ---
        (0, console_1.logWithLabel)("info", [
            "Backups scheduled with cron expression.",
            `Next backup: ${this.job.nextInvocation()}`,
            `Cron expression: ${cronExpression}`,
        ].join("\n"));
    }
    async disconnect() {
        await this.prisma.$disconnect();
        console.info(`[BackupService] PrismaClient disconnected.`);
    }
};
exports.Backups = Backups;
//# sourceMappingURL=backups.js.map
//# debugId=308845e9-91e5-5fd6-beb8-4ab2e6103806
