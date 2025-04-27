"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ipBlocker_1 = require("../../../../../shared/class/ipBlocker");
class IPBlockController {
    async blockIP(req, res) {
        try {
            const { ipAddress, reason, expiresAt, userId } = req.body;
            await ipBlocker_1.IPBlocker.getInstance().blockIP(ipAddress, userId, reason, expiresAt ? new Date(expiresAt) : undefined);
            res.json({ success: true, message: req.t("common:ip_blocked_successfully") });
        }
        catch (error) {
            res.status(500).json({ error: req.t("errors:failed_to_block_ip") });
        }
    }
    async unblockIP(req, res) {
        try {
            const { ipAddress } = req.params;
            await ipBlocker_1.IPBlocker.getInstance().unblockIP(ipAddress);
            res.json({ success: true, message: req.t("common:ip_unblocked_successfully") });
        }
        catch (error) {
            res.status(500).json({ error: req.t("errors:failed_to_unblock_ip") });
        }
    }
    async listBlockedIPs(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const ips = await ipBlocker_1.IPBlocker.getInstance().getBlockedIPs(Number(page), Number(limit));
            res.json(ips);
        }
        catch (error) {
            res.status(500).json({ error: req.t("errors:failed_to_retrieve_blocked_ips") });
        }
    }
}
exports.default = new IPBlockController();
