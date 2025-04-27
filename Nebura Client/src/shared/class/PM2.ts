import fs from "fs";
import pm2 from "pm2";
import { promisify } from "util";

// Promisify PM2 methods
const connectAsync = promisify(pm2.connect.bind(pm2));
const startAsync = promisify(pm2.start.bind(pm2));
const stopAsync = promisify(pm2.stop.bind(pm2));
const deleteAsync = promisify(pm2.delete.bind(pm2));
const restartAsync = promisify(pm2.restart.bind(pm2));
const listAsync = promisify(pm2.list.bind(pm2));
const describeAsync = promisify(pm2.describe.bind(pm2));
const reloadAsync = promisify(pm2.reload.bind(pm2));
const disconnectAsync = promisify(pm2.disconnect.bind(pm2));

interface ProcessInfo {
  pid: number;
  name: string;
  pm_id: number;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  restart_time: number;
}

export class PM2Manager {
  private static instance: PM2Manager | null = null; // Singleton instance
  private connected: boolean = false;

  private constructor() {} // Private constructor to prevent direct instantiation

  public static getInstance(): PM2Manager {
    if (!PM2Manager.instance) {
      PM2Manager.instance = new PM2Manager();
    }
    return PM2Manager.instance;
  }

  private async initialize(): Promise<void> {
    if (this.connected) return; // Avoid reconnecting if already connected
    try {
      await connectAsync();
      this.connected = true;
      console.log("Connected to PM2 daemon");
    } catch (error) {
      console.error("Failed to connect to PM2:", error);
      this.connected = false;
    }
  }

  /**
   * Start a new process
   */
  public async startProcess(
    scriptPath: string,
    name: string,
    options: any = {},
  ): Promise<{ success: boolean; message: string }> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      if (!fs.existsSync(scriptPath)) {
        return { success: false, message: "Script file does not exist" };
      }

      const startOptions = {
        script: scriptPath,
        name: name,
        ...options,
      };

      await startAsync(startOptions);
      return { success: true, message: `Process ${name} started successfully` };
    } catch (error) {
      return { success: false, message: `Failed to start process: ${error}` };
    }
  }

  /**
   * Stop a process
   */
  public async stopProcess(
    processId: string | number,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      await stopAsync(processId);
      return { success: true, message: `Process ${processId} stopped successfully` };
    } catch (error) {
      return { success: false, message: `Failed to stop process: ${error}` };
    }
  }

  /**
   * Delete a process from PM2 list
   */
  public async deleteProcess(
    processId: string | number,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      await deleteAsync(processId);
      return { success: true, message: `Process ${processId} deleted successfully` };
    } catch (error) {
      return { success: false, message: `Failed to delete process: ${error}` };
    }
  }

  /**
   * Restart a process
   */
  public async restartProcess(
    processId: string | number,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      await restartAsync(processId);
      return { success: true, message: `Process ${processId} restarted successfully` };
    } catch (error) {
      return { success: false, message: `Failed to restart process: ${error}` };
    }
  }

  /**
   * Reload a process (for cluster mode)
   */
  public async reloadProcess(
    processId: string | number,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      await reloadAsync(processId);
      return { success: true, message: `Process ${processId} reloaded successfully` };
    } catch (error) {
      return { success: false, message: `Failed to reload process: ${error}` };
    }
  }

  /**
   * Get list of all processes
   */
  public async listProcesses(): Promise<ProcessInfo[]> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      const processes = await listAsync();
      return processes.map((proc: any) => ({
        pid: proc.pid ?? 0,
        name: proc.name ?? "Unknown",
        pm_id: proc.pm_id ?? 0,
        status: proc.pm2_env?.status || "unknown",
        cpu: proc.monit?.cpu || 0,
        memory: proc.monit?.memory || 0,
        uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
        restart_time: proc.pm2_env?.restart_time || 0,
      }));
    } catch (error) {
      console.error("Error listing processes:", error);
      return [];
    }
  }

  /**
   * Get detailed information about a process
   */
  public async getProcessInfo(processId: string | number): Promise<ProcessInfo | null> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      const processes = await describeAsync(processId);
      if (processes.length === 0) return null;

      const proc = processes[0];
      if (!proc) return null;
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
    } catch (error) {
      console.error("Error getting process info:", error);
      return null;
    }
  }

  /**
   * Gracefully disconnect from PM2
   */
  public async disconnect(): Promise<void> {
    if (this.connected) {
      await disconnectAsync();
      this.connected = false;
      console.log("Disconnected from PM2 daemon");
    }
  }

  /**
   * Monitor all processes (continuous monitoring)
   */
  public async monitorProcesses(interval: number = 5000): Promise<void> {
    if (!this.connected) {
      await this.initialize();
    }

    const monitor = setInterval(async () => {
      try {
        const processes = await this.listProcesses();
        console.clear();
        console.log("PM2 Process Monitor -", new Date().toLocaleString());
        console.table(processes);
      } catch (error) {
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
