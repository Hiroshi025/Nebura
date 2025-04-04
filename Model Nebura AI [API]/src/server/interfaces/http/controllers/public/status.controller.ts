import { Request, Response } from "express";
import os from "os";
import process from "process";

import { PrismaClient } from "@prisma/client";

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
              status: 'healthy', 
              responseTime: `${responseTime}ms` 
          };
      } catch (error: any) {
          return { 
              status: 'unhealthy', 
              error: error.message 
          };
      }
  }

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
          totalMemory: os.totalmem()
      };
  }

  public getStatus = async (_req: Request, res: Response) => {
      try {
          const [databaseStatus, systemInfo] = await Promise.all([
              this.checkDatabase(),
              this.getSystemInfo()
          ]);

          res.status(200).json({
              status: 'operational',
              timestamp: new Date(),
              uptime: process.uptime(),
              database: databaseStatus,
              system: systemInfo,
              meta: {
                  apiVersion: process.env.API_VERSION || '1.0.0',
                  environment: process.env.NODE_ENV || 'development',
                  startTime: this.startTime
              }
          });
      } catch (error: any) {
          res.status(500).json({
              status: 'error',
              message: 'Failed to retrieve system status',
              error: error.message
          });
      }
  }
}