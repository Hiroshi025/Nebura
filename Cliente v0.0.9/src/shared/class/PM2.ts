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

/**
 * Interface representing information about a PM2-managed process.
 */
interface ProcessInfo {
  /** Process ID (PID) */
  pid: number;
  /** Name of the process */
  name: string;
  /** PM2 internal process ID */
  pm_id: number;
  /** Current status (e.g., online, stopped) */
  status: string;
  /** CPU usage percentage */
  cpu: number;
  /** Memory usage in bytes */
  memory: number;
  /** Uptime in milliseconds */
  uptime: number;
  /** Number of times the process has been restarted */
  restart_time: number;
}

/**
 * Singleton class for managing Node.js processes using PM2.
 *
 * Provides advanced process management capabilities such as starting, stopping,
 * deleting, restarting, reloading, listing, and monitoring processes.
 * Handles connection lifecycle with the PM2 daemon and exposes utility methods
 * for process introspection and monitoring.
 *
 * @example
 * const pm2Manager = PM2Manager.getInstance();
 * await pm2Manager.startProcess("./server.js", "my-server");
 * const processes = await pm2Manager.listProcesses();
 */
export class PM2Manager {
  /** Singleton instance of PM2Manager */
  private static instance: PM2Manager | null = null;
  /** Indicates if the manager is connected to the PM2 daemon */
  private connected: boolean = false;

  /** Private constructor to enforce singleton pattern */
  private constructor() {}

  /**
   * Returns the singleton instance of PM2Manager.
   * @returns {PM2Manager} The singleton instance.
   */
  public static getInstance(): PM2Manager {
    if (!PM2Manager.instance) {
      PM2Manager.instance = new PM2Manager();
    }
    return PM2Manager.instance;
  }

  /**
   * Initializes the connection to the PM2 daemon if not already connected.
   * Handles connection errors gracefully.
   * @internal
   */
  private async initialize(): Promise<void> {
    if (this.connected) return;
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
   * Starts a new process using PM2.
   *
   * @param scriptPath - Path to the script to run.
   * @param name - Name to assign to the process.
   * @param options - Additional PM2 start options.
   * @returns {Promise<{ success: boolean; message: string }>} Result of the operation.
   *
   * @example
   * await pm2Manager.startProcess("./app.js", "my-app", { instances: 2 });
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
   * Stops a running process.
   *
   * @param processId - PM2 process ID or name.
   * @returns {Promise<{ success: boolean; message: string }>} Result of the operation.
   *
   * @example
   * await pm2Manager.stopProcess("my-app");
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
   * Deletes a process from the PM2 process list.
   *
   * @param processId - PM2 process ID or name.
   * @returns {Promise<{ success: boolean; message: string }>} Result of the operation.
   *
   * @example
   * await pm2Manager.deleteProcess("my-app");
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
   * Restarts a process.
   *
   * @param processId - PM2 process ID or name.
   * @returns {Promise<{ success: boolean; message: string }>} Result of the operation.
   *
   * @example
   * await pm2Manager.restartProcess("my-app");
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
   * Reloads a process (useful for cluster mode).
   *
   * @param processId - PM2 process ID or name.
   * @returns {Promise<{ success: boolean; message: string }>} Result of the operation.
   *
   * @example
   * await pm2Manager.reloadProcess("my-app");
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
   * Retrieves a list of all processes managed by PM2.
   *
   * @returns {Promise<ProcessInfo[]>} Array of process information objects.
   *
   * @example
   * const processes = await pm2Manager.listProcesses();
   * console.table(processes);
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
   * Retrieves detailed information about a specific process.
   *
   * @param processId - PM2 process ID or name.
   * @returns {Promise<ProcessInfo | null>} Process information or null if not found.
   *
   * @example
   * const info = await pm2Manager.getProcessInfo("my-app");
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
   * Gracefully disconnects from the PM2 daemon.
   *
   * @returns {Promise<void>}
   *
   * @example
   * await pm2Manager.disconnect();
   */
  public async disconnect(): Promise<void> {
    if (this.connected) {
      await disconnectAsync();
      this.connected = false;
      console.log("Disconnected from PM2 daemon");
    }
  }

  /**
   * Continuously monitors all PM2-managed processes at a given interval.
   *
   * Prints a table of process information to the console at each interval.
   * Handles process exit and disconnects gracefully.
   *
   * @param interval - Monitoring interval in milliseconds (default: 5000).
   * @returns {Promise<void>}
   *
   * @example
   * await pm2Manager.monitorProcesses(10000); // Monitor every 10 seconds
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
