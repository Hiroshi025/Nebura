"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusController = void 0;
const os_1 = __importDefault(require("os"));
const process_1 = __importDefault(require("process"));
const client_1 = require("@prisma/client");
const package_json_1 = __importDefault(require("../../../../../../package.json"));
const prisma = new client_1.PrismaClient();
class StatusController {
    startTime = new Date();
    constructor() {
        // Bind all methods to ensure proper 'this' context
        this.getStatus = this.getStatus.bind(this);
        this.checkDatabase = this.checkDatabase.bind(this);
        this.getSystemInfo = this.getSystemInfo.bind(this);
    }
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
    getStatus = async (req, res) => {
        try {
            const [databaseStatus, systemInfo] = await Promise.all([
                this.checkDatabase(),
                this.getSystemInfo(),
            ]);
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
