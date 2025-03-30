import { NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

import { main } from "@/main";

import { IPBlocker } from "./ipBlocker";
import { logWithLabel } from "./utils/functions/console";

const ipBlocker = IPBlocker.getInstance();
export class RateLimitManager {
  private static instance: RateLimitManager;
  private defaultLimiter: any;

  private constructor() {
    // Default rate limiter configuration
    this.defaultLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      handler: async (req, res) => {
        const ip = req.ip || req.socket.remoteAddress;
        if (ip) {
          await this.recordRateLimitViolation(ip, req.path);
          const violationCount = await this.getViolationCount(ip);
          if (violationCount >= 3) {
            await ipBlocker.blockIP(
              ip,
              "system",
              `Automatic block due to ${violationCount} rate limit violations`,
              new Date(Date.now() + 24 * 60 * 60 * 1000), // Block for 24 hours
            );
          }
        }

        res.status(429).json({
          success: false,
          error: "Too many requests",
          message: "You have exceeded the allowed request limit",
        });
      },
    });
  }

  public static getInstance(): RateLimitManager {
    if (!RateLimitManager.instance) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }

  public getDefaultLimiter() {
    return this.defaultLimiter;
  }

  public createCustomLimiter(options: any) {
    return rateLimit({
      ...options,
      handler: async (req, res) => {
        const ip = req.ip || req.socket.remoteAddress;
        if (ip) {
          await this.recordRateLimitViolation(ip, req.path);
        }
        res.status(429).json({
          success: false,
          error: "Too many requests",
          message: options.message || "You have exceeded the custom request limit",
        });
      },
    });
  }

  private async recordRateLimitViolation(ip: string, endpoint: string): Promise<void> {
    try {
      await main.prisma.rateLimitViolation.create({
        data: {
          ipAddress: ip,
          endpoint,
          violationTime: new Date(),
        },
      });
    } catch (error) {
      logWithLabel("error", "Error recording rate limit violation:");
    }
  }

  private async getViolationCount(ip: string): Promise<number> {
    try {
      const count = await main.prisma.rateLimitViolation.count({
        where: {
          ipAddress: ip,
          violationTime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });
      return count;
    } catch (error) {
      logWithLabel("error", "Error getting rate limit violation count:");
      return 0;
    }
  }

  public async getRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if IP is blocked first
      const ip = req.ip || req.socket.remoteAddress;
      if (ip && ipBlocker.isIPBlocked(ip)) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
          message: "Your IP address has been blocked",
        });
      }

      if (req.license) {
        switch (req.license.type) {
          case "FREE":
            return this.createCustomLimiter({
              windowMs: 15 * 60 * 1000,
              max: 50,
              message: "Free tier limit exceeded (50 requests per 15 minutes)",
            })(req, res, next);
          case "BASIC":
            return this.createCustomLimiter({
              windowMs: 15 * 60 * 1000,
              max: 200,
              message: "Basic tier limit exceeded (200 requests per 15 minutes)",
            })(req, res, next);
          case "PREMIUM":
            return this.createCustomLimiter({
              windowMs: 15 * 60 * 1000,
              max: 1000,
              message: "Premium tier limit exceeded (1000 requests per 15 minutes)",
            })(req, res, next);
          default:
            return this.defaultLimiter(req, res, next);
        }
      }

      return this.defaultLimiter(req, res, next);
    } catch (error) {
      logWithLabel("error", "Error in rate limit middleware:");
      next(error);
    }
  }
}
