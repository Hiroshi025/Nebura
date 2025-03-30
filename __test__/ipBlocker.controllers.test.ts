import express, { Application } from "express";
import request from "supertest";

import ipBlockerControllers from "../src/server/interfaces/http/controllers/blocker/ipBlocker.controllers";
import { IPBlocker } from "../src/shared/ipBlocker";

// filepath: src/server/interfaces/http/controllers/blocker/ipBlocker.controllers.test.ts

jest.mock("../src/shared/ipBlocker");

const app: Application = express();
app.use(express.json());
app.post("/block-ip", ipBlockerControllers.blockIP);
app.delete("/unblock-ip/:ipAddress", ipBlockerControllers.unblockIP);
app.get("/blocked-ips", ipBlockerControllers.listBlockedIPs);

describe("IPBlockController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("blockIP", () => {
    it("should block an IP successfully", async () => {
      const mockBlockIP = jest.fn();
      (IPBlocker.getInstance as jest.Mock).mockReturnValue({ blockIP: mockBlockIP });

      const response = await request(app)
        .post("/block-ip")
        .send({ ipAddress: "192.168.1.1", reason: "Test reason", expiresAt: "2023-12-31T23:59:59Z", userId: "12345" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: "IP blocked successfully" });
      expect(mockBlockIP).toHaveBeenCalledWith("192.168.1.1", "12345", "Test reason", new Date("2023-12-31T23:59:59Z"));
    });

    it("should handle errors when blocking an IP", async () => {
      const mockBlockIP = jest.fn().mockRejectedValue(new Error("Failed to block IP"));
      (IPBlocker.getInstance as jest.Mock).mockReturnValue({ blockIP: mockBlockIP });

      const response = await request(app)
        .post("/block-ip")
        .send({ ipAddress: "192.168.1.1", reason: "Test reason" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Failed to block IP" });
    });
  });

  describe("unblockIP", () => {
    it("should unblock an IP successfully", async () => {
      const mockUnblockIP = jest.fn();
      (IPBlocker.getInstance as jest.Mock).mockReturnValue({ unblockIP: mockUnblockIP });

      const response = await request(app).delete("/unblock-ip/192.168.1.1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: "IP unblocked successfully" });
      expect(mockUnblockIP).toHaveBeenCalledWith("192.168.1.1");
    });

    it("should handle errors when unblocking an IP", async () => {
      const mockUnblockIP = jest.fn().mockRejectedValue(new Error("Failed to unblock IP"));
      (IPBlocker.getInstance as jest.Mock).mockReturnValue({ unblockIP: mockUnblockIP });

      const response = await request(app).delete("/unblock-ip/192.168.1.1");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Failed to unblock IP" });
    });
  });

  describe("listBlockedIPs", () => {
    it("should list blocked IPs successfully", async () => {
      const mockGetBlockedIPs = jest.fn().mockResolvedValue([{ ipAddress: "192.168.1.1", reason: "Test reason" }]);
      (IPBlocker.getInstance as jest.Mock).mockReturnValue({ getBlockedIPs: mockGetBlockedIPs });

      const response = await request(app).get("/blocked-ips?page=1&limit=10");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ ipAddress: "192.168.1.1", reason: "Test reason" }]);
      expect(mockGetBlockedIPs).toHaveBeenCalledWith(1, 10);
    });

    it("should handle errors when listing blocked IPs", async () => {
      const mockGetBlockedIPs = jest.fn().mockRejectedValue(new Error("Failed to retrieve blocked IPs"));
      (IPBlocker.getInstance as jest.Mock).mockReturnValue({ getBlockedIPs: mockGetBlockedIPs });

      const response = await request(app).get("/blocked-ips");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Failed to retrieve blocked IPs" });
    });
  });
});