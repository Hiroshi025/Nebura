import { Request, Response } from "express";
import os from "os";
import process from "process";

import { PrismaClient } from "@prisma/client";

import _package from "../../../../../../package.json";

// Extender la interfaz Request para incluir la propiedad 't'
declare module "express-serve-static-core" {
  interface Request {
    t: (key: string) => string;
  }
}

const prisma = new PrismaClient();

export class StatusController {
  private readonly startTime: Date = new Date();

  constructor() {
    // Bind all methods to ensure proper 'this' context
    this.getStatus = this.getStatus.bind(this);
    this.checkDatabase = this.checkDatabase.bind(this);
    this.getSystemInfo = this.getSystemInfo.bind(this);
  }

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

  public getStatus = async (req: Request, res: Response) => {
    try {
      const [databaseStatus, systemInfo] = await Promise.all([
        this.checkDatabase(),
        this.getSystemInfo(),
      ]);

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
  }
}
