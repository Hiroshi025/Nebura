import { main } from "../src/main";
import { IPBlocker } from "../src/shared/class/administrator";
import { logWithLabel } from "../src/shared/utils/functions/console";

jest.mock("../src/main", () => ({
  main: {
    prisma: {
      blockedIP: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    },
  },
}));
jest.mock("../src/shared/utils/functions/console", () => ({
  logWithLabel: jest.fn(),
}));
jest.mock("../src/shared/class/notification", () => ({
  Notification: jest.fn().mockImplementation(() => ({
    sendWebhookNotification: jest.fn(),
  })),
}));

describe("IPBlocker.autoUnblockExpiredIPs", () => {
  let ipBlocker: IPBlocker;

  beforeEach(() => {
    jest.clearAllMocks();
    ipBlocker = IPBlocker.getInstance();
    // Patch unblockIP to be a jest mock
    ipBlocker.unblockIP = jest.fn().mockResolvedValue(undefined);
  });

  it("should unblock expired IPs and log the action", async () => {
    const expiredBlocks = [{ ipAddress: "1.2.3.4" }, { ipAddress: "5.6.7.8" }];
    (main.prisma.blockedIP.findMany as jest.Mock).mockResolvedValue(expiredBlocks);

    await ipBlocker["autoUnblockExpiredIPs"]();

    expect(main.prisma.blockedIP.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        expiresAt: { lte: expect.any(Date) },
      },
    });
    expect(ipBlocker.unblockIP).toHaveBeenCalledTimes(expiredBlocks.length);
    for (const block of expiredBlocks) {
      expect(ipBlocker.unblockIP).toHaveBeenCalledWith(block.ipAddress);
    }
    expect(logWithLabel).toHaveBeenCalledWith(
      "custom",
      `${expiredBlocks.length} expired IP blocks have been automatically unblocked.`,
      expect.objectContaining({ customLabel: "IP" }),
    );
  });

  it.skip("should do nothing if there are no expired IPs", async () => {
    (main.prisma.blockedIP.findMany as jest.Mock).mockResolvedValue([]);

    await ipBlocker["autoUnblockExpiredIPs"]();

    expect(ipBlocker.unblockIP).not.toHaveBeenCalled();
    // Should not log about unblocking
    expect(
      (logWithLabel as jest.Mock).mock.calls.some(
        ([, msg]) => typeof msg === "string" && msg.includes("expired IP blocks"),
      ),
    ).toBe(false);
  });

  it.skip("should log error if findMany throws", async () => {
    const error = new Error("DB error");
    (main.prisma.blockedIP.findMany as jest.Mock).mockRejectedValue(error);

    await ipBlocker["autoUnblockExpiredIPs"]();

    expect(logWithLabel).toHaveBeenCalledWith(
      "custom",
      expect.stringContaining("Error during auto-unblock of expired IPs"),
      expect.objectContaining({
        customLabel: "IP",
        context: expect.objectContaining({ error }),
      }),
    );
    expect(ipBlocker.unblockIP).not.toHaveBeenCalled();
  });
});
