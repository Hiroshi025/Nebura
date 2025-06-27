"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="32619401-5cc9-5969-88e6-8cb54f1a5c64")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusController = void 0;
const os_1 = __importDefault(require("os"));
const process_1 = __importDefault(require("process"));
const client_1 = require("@prisma/client");
const package_json_1 = __importDefault(require("../../../../../package.json"));
/**
 * Prisma client instance for database operations.
 * @internal
 */
const prisma = new client_1.PrismaClient();
/**
 * Controller responsible for providing status and health information about the API and system.
 *
 * This controller exposes endpoints to check the operational status of the API,
 * database connectivity, and system resource usage.
 *
 * @example
 * const controller = new StatusController();
 * app.get('/status', controller.getStatus);
 */
class StatusController {
    /**
     * The timestamp when the controller instance was created.
     * Used to calculate uptime and provide meta information.
     * @readonly
     */
    startTime = new Date();
    /**
     * Initializes a new instance of the StatusController class.
     * Binds all methods to ensure correct 'this' context when used as route handlers.
     */
    constructor() {
        // Bind all methods to ensure proper 'this' context
        this.getStatus = this.getStatus.bind(this);
        this.checkDatabase = this.checkDatabase.bind(this);
        this.getSystemInfo = this.getSystemInfo.bind(this);
    }
    /**
     * Checks the health and connectivity of the database.
     *
     * Attempts to connect to the database using Prisma and measures the response time.
     * Returns an object indicating the health status and response time or error details.
     *
     * @async
     * @returns {Promise<{status: string, responseTime?: string, error?: string}>}
     * An object containing the database health status, response time (if healthy), or error message (if unhealthy).
     */
    checkDatabase = async () => {
        try {
            const start = Date.now();
            await prisma.$connect();
            const responseTime = Date.now() - start;
            return {
                status: "healthy",
                responseTime: `${responseTime}ms`,
            };
        }
        catch (error) {
            return {
                status: "unhealthy",
                error: error.message,
            };
        }
    };
    /**
     * Retrieves detailed system information and resource usage.
     *
     * Gathers data such as platform, architecture, Node.js version, memory usage,
     * uptime, CPU usage, system load, and memory statistics.
     *
     * @returns {object} An object containing system information and resource metrics.
     */
    getSystemInfo = () => {
        return {
            platform: process_1.default.platform,
            arch: process_1.default.arch,
            nodeVersion: process_1.default.version,
            memoryUsage: process_1.default.memoryUsage(),
            uptime: process_1.default.uptime(),
            cpuUsage: process_1.default.cpuUsage(),
            systemLoad: os_1.default.loadavg(),
            freeMemory: os_1.default.freemem(),
            totalMemory: os_1.default.totalmem(),
        };
    };
    /**
     * Express route handler that returns the operational status of the API.
     *
     * Responds with a JSON object containing:
     * - API operational status (translated)
     * - Current timestamp
     * - API uptime
     * - Database health and response time
     * - System information (platform, memory, CPU, etc.)
     * - Meta information (API version, environment, start time, timezone)
     *
     * Sets CORS headers to allow all origins.
     *
     * @param req - Express Request object, extended with translation function.
     * @param res - Express Response object.
     * @returns {Promise<void>} Sends a JSON response with status and system information.
     *
     * @example
     * // Example response:
     * {
     *   "status": "Operational",
     *   "timestamp": "2024-06-01T12:00:00.000Z",
     *   "uptime": 123.456,
     *   "database": { "status": "healthy", "responseTime": "10ms" },
     *   "system": {
     *     "platform": "linux",
     *     "arch": "x64",
     *     ...
     *   },
     *   "meta": {
     *     "apiVersion": "1.0.0",
     *     "environment": "development",
     *     "startTime": "2024-06-01T11:58:00.000Z",
     *     "timezone": "Europe/Madrid"
     *   }
     * }
     */
    getStatus = async (req, res) => {
        try {
            const [databaseStatus, systemInfo] = await Promise.all([
                this.checkDatabase(),
                this.getSystemInfo(),
            ]);
            const projectInfo = {
                name: package_json_1.default.name,
                description: package_json_1.default.description,
                author: package_json_1.default.author,
                repository: package_json_1.default.repository?.url || "",
            };
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.status(200).json({
                status: req.t("status.operational"),
                timestamp: new Date(),
                uptime: process_1.default.uptime(),
                database: databaseStatus,
                system: {
                    ...systemInfo,
                    hostname: os_1.default.hostname(),
                    networkInterfaces: os_1.default.networkInterfaces(),
                },
                project: projectInfo,
                meta: {
                    apiVersion: process_1.default.env.API_VERSION || package_json_1.default.version,
                    environment: process_1.default.env.NODE_ENV || "development",
                    startTime: this.startTime,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            });
        }
        catch (error) {
            res.status(500).json({
                status: req.t("status.error"),
                message: req.t("status.failed_to_retrieve"),
                error: error.message,
            });
        }
    };
}
exports.StatusController = StatusController;
//# sourceMappingURL=status.controller.js.map
//# debugId=32619401-5cc9-5969-88e6-8cb54f1a5c64
