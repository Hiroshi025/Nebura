"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PM2Manager = void 0;
const fs_1 = __importDefault(require("fs"));
const pm2_1 = __importDefault(require("pm2"));
const util_1 = require("util");
// Promisify PM2 methods
const connectAsync = (0, util_1.promisify)(pm2_1.default.connect.bind(pm2_1.default));
const startAsync = (0, util_1.promisify)(pm2_1.default.start.bind(pm2_1.default));
const stopAsync = (0, util_1.promisify)(pm2_1.default.stop.bind(pm2_1.default));
const deleteAsync = (0, util_1.promisify)(pm2_1.default.delete.bind(pm2_1.default));
const restartAsync = (0, util_1.promisify)(pm2_1.default.restart.bind(pm2_1.default));
const listAsync = (0, util_1.promisify)(pm2_1.default.list.bind(pm2_1.default));
const describeAsync = (0, util_1.promisify)(pm2_1.default.describe.bind(pm2_1.default));
const reloadAsync = (0, util_1.promisify)(pm2_1.default.reload.bind(pm2_1.default));
const disconnectAsync = (0, util_1.promisify)(pm2_1.default.disconnect.bind(pm2_1.default));
class PM2Manager {
    connected = false;
    constructor() {
        this.initialize();
    }
    async initialize() {
        try {
            await connectAsync();
            this.connected = true;
            console.log("Connected to PM2 daemon");
        }
        catch (error) {
            console.error("Failed to connect to PM2:", error);
            this.connected = false;
        }
    }
    /**
     * Start a new process
     */
    async startProcess(scriptPath, name, options = {}) {
        if (!this.connected) {
            await this.initialize();
        }
        try {
            if (!fs_1.default.existsSync(scriptPath)) {
                return { success: false, message: "Script file does not exist" };
            }
            const startOptions = {
                script: scriptPath,
                name: name,
                ...options,
            };
            await startAsync(startOptions);
            return { success: true, message: `Process ${name} started successfully` };
        }
        catch (error) {
            return { success: false, message: `Failed to start process: ${error}` };
        }
    }
    /**
     * Stop a process
     */
    async stopProcess(processId) {
        if (!this.connected) {
            await this.initialize();
        }
        try {
            await stopAsync(processId);
            return { success: true, message: `Process ${processId} stopped successfully` };
        }
        catch (error) {
            return { success: false, message: `Failed to stop process: ${error}` };
        }
    }
    /**
     * Delete a process from PM2 list
     */
    async deleteProcess(processId) {
        if (!this.connected) {
            await this.initialize();
        }
        try {
            await deleteAsync(processId);
            return { success: true, message: `Process ${processId} deleted successfully` };
        }
        catch (error) {
            return { success: false, message: `Failed to delete process: ${error}` };
        }
    }
    /**
     * Restart a process
     */
    async restartProcess(processId) {
        if (!this.connected) {
            await this.initialize();
        }
        try {
            await restartAsync(processId);
            return { success: true, message: `Process ${processId} restarted successfully` };
        }
        catch (error) {
            return { success: false, message: `Failed to restart process: ${error}` };
        }
    }
    /**
     * Reload a process (for cluster mode)
     */
    async reloadProcess(processId) {
        if (!this.connected) {
            await this.initialize();
        }
        try {
            await reloadAsync(processId);
            return { success: true, message: `Process ${processId} reloaded successfully` };
        }
        catch (error) {
            return { success: false, message: `Failed to reload process: ${error}` };
        }
    }
    /**
     * Get list of all processes
     */
    async listProcesses() {
        if (!this.connected) {
            await this.initialize();
        }
        try {
            const processes = await listAsync();
            return processes.map((proc) => ({
                pid: proc.pid ?? 0,
                name: proc.name ?? "Unknown",
                pm_id: proc.pm_id ?? 0,
                status: proc.pm2_env?.status || "unknown",
                cpu: proc.monit?.cpu || 0,
                memory: proc.monit?.memory || 0,
                uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
                restart_time: proc.pm2_env?.restart_time || 0,
            }));
        }
        catch (error) {
            console.error("Error listing processes:", error);
            return [];
        }
    }
    /**
     * Get detailed information about a process
     */
    async getProcessInfo(processId) {
        if (!this.connected) {
            await this.initialize();
        }
        try {
            const processes = await describeAsync(processId);
            if (processes.length === 0)
                return null;
            const proc = processes[0];
            if (!proc)
                return null;
            return {
                pid: proc.pid ?? 0,
                name: proc.name ?? "Unknown",
                pm_id: proc.pm_id ?? 0,
                status: proc.pm2_env?.status || "unknown",
                cpu: proc.monit?.cpu || 0,
                memory: proc.monit?.memory || 0,
                uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
                restart_time: proc.pm2_env?.restart_time || 0,
            };
        }
        catch (error) {
            console.error("Error getting process info:", error);
            return null;
        }
    }
    /**
     * Gracefully disconnect from PM2
     */
    async disconnect() {
        if (this.connected) {
            await disconnectAsync();
            this.connected = false;
        }
    }
    /**
     * Monitor all processes (continuous monitoring)
     */
    async monitorProcesses(interval = 5000) {
        if (!this.connected) {
            await this.initialize();
        }
        const monitor = setInterval(async () => {
            try {
                const processes = await this.listProcesses();
                console.clear();
                console.log("PM2 Process Monitor -", new Date().toLocaleString());
                console.table(processes);
            }
            catch (error) {
                console.error("Monitoring error:", error);
                clearInterval(monitor);
            }
        }, interval);
        // Handle process exit
        process.on("SIGINT", () => {
            clearInterval(monitor);
            this.disconnect().then(() => process.exit(0));
        });
    }
}
exports.PM2Manager = PM2Manager;
