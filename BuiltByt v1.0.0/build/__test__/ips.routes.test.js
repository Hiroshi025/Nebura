"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="122722fb-190b-51b8-a449-f5c179e8bbc5")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("discord.js", () => ({
    EmbedBuilder: class {
    },
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
const ips_routes_1 = __importDefault(require("../src/interfaces/http/routes/api/admin/ips.routes"));
const rateLimit_1 = require("../src/interfaces/messaging/broker/rateLimit");
const mockCreateCustomLimiter = jest.fn(() => "rateLimiter");
const mockGetInstance = jest.fn(() => ({
    createCustomLimiter: mockCreateCustomLimiter,
}));
rateLimit_1.RateLimitManager.getInstance = mockGetInstance;
describe("ips.routes", () => {
    let app;
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
        (0, ips_routes_1.default)({ app });
        expect(app.delete).toHaveBeenCalledWith("/api/v1/admin/unblock-ip/:ipAddress", "rateLimiter", expect.any(Function), // authenticateToken
        expect.any(Function), // isAdmin
        expect.any(Function));
        expect(mockCreateCustomLimiter).toHaveBeenCalledWith({
            max: 10,
            windowMs: 60 * 1000,
            message: "Too many requests, please try again later.",
        });
    });
    it("should register GET /api/v1/admin/blocked-ips route with correct middlewares", () => {
        (0, ips_routes_1.default)({ app });
        expect(app.get).toHaveBeenCalledWith("/api/v1/admin/blocked-ips", "rateLimiter", expect.any(Function), // authenticateToken
        expect.any(Function), // isAdmin
        expect.any(Function));
        expect(mockCreateCustomLimiter).toHaveBeenCalledWith({
            max: 10,
            windowMs: 60 * 1000,
            message: "Too many requests, please try again later.",
        });
    });
    it("should register POST /api/v1/admin/block-ip route with correct middlewares", () => {
        (0, ips_routes_1.default)({ app });
        expect(app.post).toHaveBeenCalledWith("/api/v1/admin/block-ip", "rateLimiter", expect.any(Function), // authenticateToken
        expect.any(Function), // isAdmin
        expect.any(Function));
        expect(mockCreateCustomLimiter).toHaveBeenCalledWith({
            max: 10,
            windowMs: 60 * 1000,
            message: "Too many requests, please try again later.",
        });
    });
    it("should call RateLimitManager.getInstance only three times", () => {
        (0, ips_routes_1.default)({ app });
        expect(mockGetInstance).toHaveBeenCalledTimes(3);
        expect(mockCreateCustomLimiter).toHaveBeenCalledTimes(3);
    });
});
//# sourceMappingURL=ips.routes.test.js.map
//# debugId=122722fb-190b-51b8-a449-f5c179e8bbc5
