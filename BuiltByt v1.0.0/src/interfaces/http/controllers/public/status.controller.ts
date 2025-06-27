import { Request, Response } from "express";
import os from "os";
import process from "process";

import { PrismaClient } from "@prisma/client";

import _package from "../../../../../package.json";

/**
 * Extends the Express Request interface to include the 't' property for translations.
 * @module ExpressRequestExtension
 */
declare module "express-serve-static-core" {
  interface Request {
    /**
     * Translation function for internationalization.
     * @param key - The translation key.
     * @returns The translated string.
     */
    t: (key: string) => string;
  }
}

/**
 * Prisma client instance for database operations.
 * @internal
 */
const prisma = new PrismaClient();

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
export class StatusController {
  /**
   * The timestamp when the controller instance was created.
   * Used to calculate uptime and provide meta information.
   * @readonly
   */
  private readonly startTime: Date = new Date();

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
  private checkDatabase = async () => {
    try {
      const start = Date.now();
      await prisma.$connect();
      const responseTime = Date.now() - start;
      return {
        status: "healthy",
        responseTime: `${responseTime}ms`,
      };
    } catch (error: any) {
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
  private getSystemInfo = () => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      systemLoad: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
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
  public getStatus = async (req: Request, res: Response) => {
    try {
      const [databaseStatus, systemInfo] = await Promise.all([
        this.checkDatabase(),
        this.getSystemInfo(),
      ]);

      const projectInfo = {
        name: _package.name,
        description: _package.description,
        author: _package.author,
        repository: _package.repository?.url || "",
      };

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).json({
        status: req.t("status.operational"),
        timestamp: new Date(),
        uptime: process.uptime(),
        database: databaseStatus,
        system: {
          ...systemInfo,
          hostname: os.hostname(),
          networkInterfaces: os.networkInterfaces(),
        },
        project: projectInfo,
        meta: {
          apiVersion: process.env.API_VERSION || _package.version,
          environment: process.env.NODE_ENV || "development",
          startTime: this.startTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: req.t("status.error"),
        message: req.t("status.failed_to_retrieve"),
        error: error.message,
      });
    }
  };
}
