jest.mock("discord.js", () => ({
  EmbedBuilder: class {},
  ChannelType: {
    GuildText: "GuildText",
    PublicThread: "PublicThread",
    PrivateThread: "PrivateThread",
    AnnouncementThread: "AnnouncementThread",
    // Agrega aquí otros tipos si tu código los usa
  },
}));

jest.mock("../src/interfaces/http/middlewares/jwt/token.middleware", () => ({
  authenticateToken: jest.fn((_req, _res, next) => next()),
}));
jest.mock("../src/interfaces/http/middlewares/jwt/auth.middleware", () => ({
  isAdmin: jest.fn((_req, _res, next) => next()),
}));
jest.mock("../src/interfaces/http/controllers/admin/ip.controllers", () => ({
  unblockIP: jest.fn(),
  listBlockedIPs: jest.fn(),
  blockIP: jest.fn(),
}));

import registerIPSRoutes from "../src/interfaces/http/routes/api/admin/ips.routes";
import { RateLimitManager } from "../src/interfaces/messaging/broker/rateLimit";

const mockCreateCustomLimiter = jest.fn(() => "rateLimiter");
const mockGetInstance = jest.fn(() => ({
  createCustomLimiter: mockCreateCustomLimiter,
}));
RateLimitManager.getInstance = mockGetInstance as unknown as () => RateLimitManager;

describe("ips.routes", () => {
  let app: any;

  beforeEach(() => {
    app = {
      delete: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
    };
    mockCreateCustomLimiter.mockClear();
    app.delete.mockClear();
    app.get.mockClear();
    app.post.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("should register DELETE /api/v1/admin/unblock-ip/:ipAddress route with correct middlewares", () => {
    registerIPSRoutes({ app });

    expect(app.delete).toHaveBeenCalledWith(
      "/api/v1/admin/unblock-ip/:ipAddress",
      "rateLimiter",
      expect.any(Function), // authenticateToken
      expect.any(Function), // isAdmin
      expect.any(Function), // unblockIP
    );
    expect(mockCreateCustomLimiter).toHaveBeenCalledWith({
      max: 10,
      windowMs: 60 * 1000,
      message: "Too many requests, please try again later.",
    });
  });

  it("should register GET /api/v1/admin/blocked-ips route with correct middlewares", () => {
    registerIPSRoutes({ app });

    expect(app.get).toHaveBeenCalledWith(
      "/api/v1/admin/blocked-ips",
      "rateLimiter",
      expect.any(Function), // authenticateToken
      expect.any(Function), // isAdmin
      expect.any(Function), // listBlockedIPs
    );
    expect(mockCreateCustomLimiter).toHaveBeenCalledWith({
      max: 10,
      windowMs: 60 * 1000,
      message: "Too many requests, please try again later.",
    });
  });

  it("should register POST /api/v1/admin/block-ip route with correct middlewares", () => {
    registerIPSRoutes({ app });

    expect(app.post).toHaveBeenCalledWith(
      "/api/v1/admin/block-ip",
      "rateLimiter",
      expect.any(Function), // authenticateToken
      expect.any(Function), // isAdmin
      expect.any(Function), // blockIP
    );
    expect(mockCreateCustomLimiter).toHaveBeenCalledWith({
      max: 10,
      windowMs: 60 * 1000,
      message: "Too many requests, please try again later.",
    });
  });

  it("should call RateLimitManager.getInstance only three times", () => {
    registerIPSRoutes({ app });
    expect(mockGetInstance).toHaveBeenCalledTimes(3);
    expect(mockCreateCustomLimiter).toHaveBeenCalledTimes(3);
  });
});
