import { Request, Response } from "express";

import { IPBlocker } from "@/shared/ipBlocker";

class IPBlockController {
  async blockIP(req: Request, res: Response) {
    try {
      const { ipAddress, reason, expiresAt, userId } = req.body;

      await IPBlocker.getInstance().blockIP(
        ipAddress, 
        userId, 
        reason, 
        expiresAt ? new Date(expiresAt) : undefined
      );

      res.json({ success: true, message: 'IP blocked successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to block IP' });
    }
  }

  async unblockIP(req: Request, res: Response) {
    try {
      const { ipAddress } = req.params;
      await IPBlocker.getInstance().unblockIP(ipAddress);
      res.json({ success: true, message: 'IP unblocked successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unblock IP' });
    }
  }

  async listBlockedIPs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const ips = await IPBlocker.getInstance().getBlockedIPs(
        Number(page), 
        Number(limit)
      );
      res.json(ips);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve blocked IPs' });
    }
  }
}

export default new IPBlockController();