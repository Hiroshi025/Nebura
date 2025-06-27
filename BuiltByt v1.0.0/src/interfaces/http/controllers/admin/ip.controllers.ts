import { Request, Response } from "express";

import { IPBlocker } from "@/interfaces/messaging/broker/administrator";

/**
 * Controller for managing IP blocking and unblocking operations.
 *
 * Provides endpoints for blocking an IP address, unblocking an IP address,
 * and listing currently blocked IPs. Uses the singleton IPBlocker class for logic.
 *
 * @example
 * // Usage with Express:
 * app.post('/admin/ip/block', ipBlockController.blockIP);
 * app.delete('/admin/ip/:ipAddress/unblock', ipBlockController.unblockIP);
 * app.get('/admin/ip/blocked', ipBlockController.listBlockedIPs);
 */
class IPBlockController {
  /**
   * Blocks a specific IP address for a given reason and optional expiration.
   *
   * Expects `ipAddress`, `reason`, `userId`, and optional `expiresAt` in the request body.
   * Responds with a success message or error.
   *
   * @param req - Express Request object with block details in body.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response indicating success or error.
   *
   * @example
   * // POST /admin/ip/block
   * // Body: { "ipAddress": "1.2.3.4", "reason": "Abuse", "userId": "123", "expiresAt": "2024-07-01T00:00:00Z" }
   */
  async blockIP(req: Request, res: Response) {
    try {
      const { ipAddress, reason, expiresAt, userId } = req.body;

      await IPBlocker.getInstance().blockIP(
        ipAddress,
        userId,
        reason,
        expiresAt ? new Date(expiresAt) : undefined,
      );

      res.json({ success: true, message: req.t("common:ip_blocked_successfully") });
    } catch (error) {
      res.status(500).json({ error: req.t("errors:failed_to_block_ip") });
    }
  }

  /**
   * Unblocks a specific IP address.
   *
   * Expects `ipAddress` in the request parameters.
   * Responds with a success message or error.
   *
   * @param req - Express Request object with `ipAddress` in params.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response indicating success or error.
   *
   * @example
   * // DELETE /admin/ip/1.2.3.4/unblock
   */
  async unblockIP(req: Request, res: Response) {
    try {
      const { ipAddress } = req.params;
      await IPBlocker.getInstance().unblockIP(ipAddress);
      res.json({ success: true, message: req.t("common:ip_unblocked_successfully") });
    } catch (error) {
      res.status(500).json({ error: req.t("errors:failed_to_unblock_ip") });
    }
  }

  /**
   * Lists currently blocked IP addresses with pagination.
   *
   * Accepts optional `page` and `limit` query parameters for pagination.
   * Responds with an array of blocked IPs.
   *
   * @param req - Express Request object with optional `page` and `limit` in query.
   * @param res - Express Response object.
   * @returns {Promise<void>} Sends a JSON response with the list of blocked IPs or error.
   *
   * @example
   * // GET /admin/ip/blocked?page=1&limit=20
   * // Response: [ { ipAddress: "1.2.3.4", ... }, ... ]
   */
  async listBlockedIPs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const ips = await IPBlocker.getInstance().getBlockedIPs(Number(page), Number(limit));
      res.json(ips);
    } catch (error) {
      res.status(500).json({ error: req.t("errors:failed_to_retrieve_blocked_ips") });
    }
  }
}

export default new IPBlockController();
