"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.main = exports.Engine = void 0;

const bson_1 = require("bson");
const chalk_1 = __importDefault(require("chalk"));
const emojis_json_1 = __importDefault(require("../config/json/emojis.json"));
const utils_extender_1 = require("./structure/extenders/discord/utils.extender");
const errors_extender_1 = require("./structure/extenders/errors.extender");
const client_1 = require("@prisma/client");
const reminders_1 = require("./shared/utils/functions/reminders");
const client_2 = require("./modules/discord/structure/client");
const errors_1 = require("./modules/discord/structure/handlers/errors");
const whatsapp_1 = require("./modules/whatsapp");
const server_1 = require("./server");
const config_1 = require("./shared/utils/config");
const console_1 = require("./shared/utils/functions/console");

// Carga las variables de entorno
process.loadEnvFile();

// Configuración global de errores
process.on('uncaughtException', (err) => {
    console.error('‼️ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('‼️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Configuración de shutdown
const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
shutdownSignals.forEach(signal => {
    process.on(signal, async () => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        try {
            if (exports.main) {
                await exports.main.shutdown();
            }
            process.exit(0);
        } catch (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
});

const defaultConfig = config_1.config;

/**
 * Main class responsible for initializing and managing the core modules of the application.
 */
class Engine {
    /**
     * Prisma client instance used for database interactions.
     */
    prisma;
    /**
     * Instance of the Discord module.
     */
    discord;
    /**
     * Instance of the API server module.
     */
    api;
    /**
     * Instance of the WhatsApp module.
     */
    whatsapp;
    /**
     * Configuration object for the project.
     */
    config;
    /**
     * Instance of the Utils class.
     */
    utils;

    constructor(
        prisma = new client_1.PrismaClient({
            log: [
                { emit: "event", level: "query" },
                { emit: "event", level: "info" },
                { emit: "event", level: "warn" },
                { emit: "event", level: "error" },
            ],
            errorFormat: "minimal",
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        }),
        config = defaultConfig,
        discord = new client_2.MyClient(),
        whatsapp = new whatsapp_1.MyApp(),
        api = new server_1.API()
    ) {
        console.log('🚀 Initializing Engine...');
        
        // Verify Prisma connection
        prisma.$connect()
            .then(() => console.log('✅ Prisma connected successfully'))
            .catch(err => {
                console.error('‼️ Prisma connection error:', err);
                process.exit(1);
            });

        // Setup Prisma error handling
        prisma.$on('error', (e) => {
            console.error('‼️ Prisma error:', e);
        });

        this.utils = new utils_extender_1.Utils();
        this.whatsapp = whatsapp;
        this.discord = discord;
        this.api = api;
        this.prisma = prisma;
        this.config = config;

        console.log('🛠️ Engine instance created');
    }

    /**
     * Starts the core modules of the application.
     */
    async start() {
        try {
            console.log('🔧 Starting application modules...');
            
            await (0, errors_1.ErrorConsole)(this.discord);
            await this.initializeModules();
            await this.clientCreate();
            await (0, reminders_1.loadPendingReminders)();

            console.log('✅ All modules started successfully');
        } catch (err) {
            console.error('‼️ Error during startup:', err);
            await this.handleError(err);
        }
    }

    /**
     * Initializes the core modules.
     */
    async initializeModules() {
        console.log('⚙️ Initializing modules...');
        
        try {
            await Promise.all([
                this.startWithRetry(this.discord.start.bind(this.discord), 'Discord'),
                this.startWithRetry(this.api.start.bind(this.api), 'API')
            ]);

            if (this.config.modules.whatsapp.enabled) {
                await this.startWithRetry(this.whatsapp.start.bind(this.whatsapp), 'WhatsApp');
            } else {
                (0, console_1.logWithLabel)("custom", [
                    "Client is not ready!",
                    `  ${emojis_json_1.default.loading}  ${chalk_1.default.grey("The WhatsApp API module has not started.")}`,
                ].join("\n"), "Whatsapp");
            }
        } catch (err) {
            console.error('‼️ Module initialization failed:', err);
            throw err;
        }
    }

    /**
     * Helper method to start modules with retry logic.
     */
    async startWithRetry(moduleStart, moduleName, retries = 3, delay = 5000) {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`🔄 Attempt ${i + 1} to start ${moduleName}...`);
                await moduleStart();
                console.log(`✅ ${moduleName} started successfully`);
                return;
            } catch (err) {
                console.error(`‼️ ${moduleName} start attempt ${i + 1} failed:`, err);
                if (i === retries - 1) throw err;
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }

    /**
     * Handles errors that occur during the application startup process.
     */
    async handleError(err) {
        console.error('‼️ Application error:', err);
        await this.shutdown();
        throw new errors_extender_1.ProyectError(`Error starting the application: ${err}`);
    }

    /**
     * Creates or updates the Discord client configuration in the database.
     */
    async clientCreate() {
        console.log('📝 Creating/updating Discord client configuration...');
        
        try {
            const data = config_1.config.modules.discord;
            const validId = new bson_1.ObjectId().toHexString();
            
            await this.prisma.myDiscord.upsert({
                where: { token: data.token },
                update: {
                    token: data.token,
                    clientId: data.clientId,
                    clientSecret: data.clientSecret,
                },
                create: {
                    id: validId,
                    token: data.token,
                    clientId: data.clientId,
                    clientSecret: data.clientSecret,
                },
            });
            
            console.log('✅ Discord client configuration updated');
        } catch (err) {
            console.error('‼️ Error updating Discord client configuration:', err);
            throw err;
        }
    }

    /**
     * Graceful shutdown procedure.
     */
    async shutdown() {
        console.log('🛑 Starting shutdown sequence...');
        
        const shutdownPromises = [];
        
        if (this.prisma) {
            shutdownPromises.push(
                this.prisma.$disconnect()
                    .then(() => console.log('✅ Prisma disconnected'))
                    .catch(err => console.error('‼️ Error disconnecting Prisma:', err))
            );
        }
        
        if (this.discord) {
            shutdownPromises.push(
                this.discord.destroy()
                    .then(() => console.log('✅ Discord client destroyed'))
                    .catch(err => console.error('‼️ Error destroying Discord client:', err))
            );
        }
        
        if (this.api) {
            shutdownPromises.push(
                this.api.close()
                    .then(() => console.log('✅ API server closed'))
                    .catch(err => console.error('‼️ Error closing API server:', err))
            );
        }
        
        if (this.whatsapp) {
            shutdownPromises.push(
                this.whatsapp.shutdown()
                    .then(() => console.log('✅ WhatsApp module shutdown'))
                    .catch(err => console.error('‼️ Error shutting down WhatsApp module:', err))
            );
        }
        
        await Promise.all(shutdownPromises);
        console.log('🛑 Shutdown sequence completed');
    }
}

exports.Engine = Engine;

// Main application instance
console.log('🏗️ Creating main application instance...');
exports.main = new Engine();
exports.client = exports.main.discord;

// Start the application with error handling
exports.main.start()
    .then(() => console.log('🎉 Application started successfully!'))
    .catch(async (err) => {
        console.error('‼️ Fatal error during application startup:', err);
        try {
            await exports.main.shutdown();
        } catch (shutdownErr) {
            console.error('‼️ Error during emergency shutdown:', shutdownErr);
        }
        process.exit(1);
    });

// Keep the process alive
setInterval(() => {}, 1 << 30);