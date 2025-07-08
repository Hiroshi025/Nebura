import chalk from "chalk";
import { NextFunction, Request, Response } from "express";

import { main } from "@/main";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";
import { config } from "@utils/config";

import { Notification } from "./notification";

/**
 * Class to manage IP address blocking.
 */
export class IPBlocker {
  private static instance: IPBlocker;
  private notifications: typeof config.moderation.notifications;
  private blockedIPs: Set<string> = new Set();
  private lastUpdate: Date = new Date(0);

  /**
   * Private constructor to implement the Singleton pattern.
   */
  private constructor() {
    this.notifications = config.moderation.notifications;
    this.loadBlockedIPs();
    // Update every hour
    setInterval(() => this.loadBlockedIPs(), 60 * 60 * 1000);
    // Auto-unblock expired IPs every 10 minutes
    setInterval(() => this.autoUnblockExpiredIPs(), 10 * 60 * 1000);
  }

  /**
   * Gets the unique instance of IPBlocker.
   * @returns The IPBlocker instance.
   */
  public static getInstance(): IPBlocker {
    if (!IPBlocker.instance) {
      IPBlocker.instance = new IPBlocker();
    }
    return IPBlocker.instance;
  }

  /**
   * Loads blocked IP addresses from the database.
   * @returns A promise that resolves when the IPs are loaded.
   */
  private async loadBlockedIPs(): Promise<void> {
    try {
      logWithLabel("custom", "Loading blocked IPs...", {
        customLabel: "IP",
      });
      const now = new Date();
      const activeBlocks = await main.prisma.blockedIP.findMany({
        where: {
          isActive: true,
          OR: [{ expiresAt: { gt: now } }, { expiresAt: undefined }],
        },
      });

      // Asegura que activeBlocks sea siempre un array
      this.blockedIPs = new Set((activeBlocks ?? []).map((block) => block.ipAddress));
      this.lastUpdate = new Date();
      logWithLabel(
        "custom",
        [
          `${this.blockedIPs.size} Ips is blocked and loaded in memory.`,
          `  ${chalk.grey(`${emojis.moderator}   Last update: ${this.lastUpdate.toISOString()}`)}`,
        ].join("\n"),
        {
          customLabel: "IP",
        },
      );
    } catch (error) {
      logWithLabel("custom", `Error loading blocked IPs: ${error}`, {
        customLabel: "IP",
        context: {
          error: error,
          blockedIPs: this.blockedIPs,
          lastUpdate: this.lastUpdate,
        },
      });
      throw error;
    }
  }

  /**
   * Automatically unblocks IPs whose block duration has expired.
   */
  private async autoUnblockExpiredIPs(): Promise<void> {
    try {
      const now = new Date();
      const expiredBlocks = await main.prisma.blockedIP.findMany({
        where: {
          isActive: true,
          expiresAt: { lte: now },
        },
      });

      for (const block of expiredBlocks) {
        await this.unblockIP(block.ipAddress);
      }

      if (expiredBlocks.length > 0) {
        logWithLabel(
          "custom",
          `${expiredBlocks.length} expired IP blocks have been automatically unblocked.`,
          {
            customLabel: "IP",
          },
        );
      }
    } catch (error) {
      logWithLabel("custom", `Error during auto-unblock of expired IPs: ${error}`, {
        customLabel: "IP",
        context: {
          error: error,
          blockedIPs: this.blockedIPs,
          lastUpdate: this.lastUpdate,
        },
      });
    }
  }

  /**
   * Blocks an IP address.
   * @param ipAddress - The IP address to block.
   * @param userId - The ID of the user performing the block.
   * @param reason - The reason for the block (optional).
   * @param expiresAt - The expiration date of the block (optional).
   * @returns A promise that resolves when the IP is blocked.
   */
  public async blockIP(
    ipAddress: string,
    userId: string,
    reason?: string,
    expiresAt?: Date,
  ): Promise<void> {
    try {
      await main.prisma.blockedIP.upsert({
        where: { ipAddress },
        update: {
          reason,
          blockedBy: userId,
          expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
          isActive: true,
        },
        create: {
          ipAddress,
          reason,
          blockedBy: userId,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          isActive: true,
        },
      });

      this.blockedIPs.add(ipAddress);
      logWithLabel(
        "api",
        `[IPBlocker] IP ${ipAddress} blocked by ${userId}. Reason: ${reason || "Not specified"}`,
      );

      // Send notification if webhook token is valid
      if (this.notifications.webhooks.token) {
        const notification = new Notification();
        await notification.sendWebhookNotification(
          "IP Blocked",
          `The IP address ${ipAddress} has been blocked.`,
          "#FF0000",
          [
            { name: "Blocked By", value: userId, inline: true },
            { name: "Reason", value: reason || "Not specified", inline: true },
            { name: "Expires At", value: expiresAt?.toISOString() || "Indefinite", inline: true },
          ],
        );
      }
    } catch (error) {
      logWithLabel("api", `[IPBlocker] Error blocking IP ${ipAddress}: ${error}`);
      throw error;
    }
  }

  /**
   * Unblocks an IP address.
   * @param ipAddress - The IP address to unblock.
   * @returns A promise that resolves when the IP is unblocked.
   */
  public async unblockIP(ipAddress: string): Promise<void> {
    try {
      await main.prisma.blockedIP.updateMany({
        where: { ipAddress },
        data: { isActive: false },
      });

      this.blockedIPs.delete(ipAddress);
      logWithLabel("api", `[IPBlocker] IP ${ipAddress} unblocked.`);

      // Send notification if webhook token is valid
      if (this.notifications.webhooks.token) {
        const notification = new Notification();
        await notification.sendWebhookNotification(
          "IP Unblocked",
          `The IP address ${ipAddress} has been unblocked.`,
          "#00FF00",
          [{ name: "IP Address", value: ipAddress, inline: true }],
        );
      }
    } catch (error) {
      logWithLabel("api", `[IPBlocker] Error unblocking IP ${ipAddress}: ${error}`);
      throw error;
    }
  }

  /**
   * Checks if an IP address is blocked.
   * @param ipAddress - The IP address to check.
   * @returns `true` if the IP is blocked, otherwise `false`.
   */
  public isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Gets the middleware to block requests from blocked IPs.
   * @returns Express middleware.
   */
  public getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      if (typeof clientIp !== "string") {
        return res.status(400).json({ error: "Could not determine IP address" });
      }

      // Extract the real IP if behind a proxy
      const realIp = clientIp.split(",")[0].trim();

      if (this.isIPBlocked(realIp)) {
        logWithLabel("api", `[IPBlocker] IP ${realIp} blocked. Access denied.`);
        return res.status(403).json({
          error: "Access denied",
          reason: "Your IP address has been blocked",
        });
      }

      next();
      return;
    };
  }

  /**
   * Retrieves a paginated list of blocked IP addresses.
   * @param page - Page number (default is 1).
   * @param limit - Number of results per page (default is 20).
   * @returns A promise that resolves with the list of blocked IPs.
   */
  public async getBlockedIPs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return await main.prisma.blockedIP.findMany({
      where: { isActive: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { blockedUser: { select: { id: true, name: true, email: true } } },
    });
  }

  /**
   * Logs a failed attempt from an IP address.
   * If the allowed attempts are exceeded, the IP will be automatically blocked.
   * @param ipAddress - The IP address of the failed attempt.
   * @returns A promise that resolves when the attempt is logged.
   */
  public async recordFailedAttempt(ipAddress: string): Promise<void> {
    try {
      // Log the failed attempt in the database
      await main.prisma.failedAttempt.create({
        data: {
          ipAddress,
          attemptTime: new Date(),
        },
      });

      // Check if it exceeds the attempt limit
      const attemptCount = await main.prisma.failedAttempt.count({
        where: {
          ipAddress,
          attemptTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
      });

      // Automatically block after 5 failed attempts
      if (attemptCount >= 5) {
        await this.blockIP(
          ipAddress,
          "system",
          "Automatic block due to multiple failed attempts",
          new Date(Date.now() + 24 * 60 * 60 * 1000), // Block for 24 hours
        );

        // Send notification if webhook token is valid
        if (this.notifications.webhooks.token) {
          const notification = new Notification();
          await notification.sendWebhookNotification(
            "Automatic IP Block",
            `The IP address ${ipAddress} has been automatically blocked due to multiple failed attempts.`,
            "#FFA500",
            [
              { name: "IP Address", value: ipAddress, inline: true },
              { name: "Reason", value: "Multiple failed attempts", inline: true },
              { name: "Blocked Duration", value: "24 hours", inline: true },
            ],
          );
        }
      }
    } catch (error) {
      logWithLabel(
        "api",
        `[IPBlocker] Error logging failed attempt from IP ${ipAddress}: ${error}`,
      );
      throw error;
    }
  }
}
