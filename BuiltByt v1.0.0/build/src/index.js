"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="48d6abbf-abe4-5ca2-bd6b-c2c375b880bd")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API = void 0;
const apicache_1 = __importDefault(require("apicache"));
const chalk_1 = __importDefault(require("chalk"));
//import cors from "cors";
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const uuid_1 = require("uuid");
const main_1 = require("./main");
const error_extend_1 = require("./shared/adapters/extends/error.extend");
const i18n_1 = __importDefault(require("./shared/i18n"));
const config_1 = require("./shared/utils/config");
const console_1 = require("./shared/utils/functions/console");
const emojis_json_1 = __importDefault(require("../config/json/emojis.json"));
const passport_1 = require("./adapters/external/passport");
const swagger_1 = __importDefault(require("./adapters/external/swagger"));
const administrator_1 = require("./interfaces/messaging/broker/administrator");
const monitor_1 = require("./shared/monitor");
const routes_1 = require("./shared/utils/routes");
/* const corsOptions = {
  origin: hostURL(),
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}; */
/**
 * @class API
 * @classdesc
 * Main class responsible for initializing and configuring the API server.
 * This class sets up the Express application, HTTP server, and Socket.IO server.
 * It also configures middleware, routes, and other server functionalities.
 *
 * @example
 * ```typescript
 * const api = new API();
 * await api.start();
 * ```
 */
class API {
    /**
     * Instance of the Express application.
     * Used to define routes, middleware, and other Express-specific configurations.
     *
     * @type {Application}
     * @see [Express Application](https://expressjs.com/en/4x/api.html#app)
     */
    app;
    /**
     * HTTP server instance created using `http.createServer`.
     * This server is used to handle incoming HTTP requests.
     *
     * @type {any}
     * @see [Node.js HTTP Server](https://nodejs.org/api/http.html#class-httpserver)
     */
    server;
    /**
     * Instance of the Socket.IO server.
     * Used to manage WebSocket connections for real-time communication.
     *
     * @type {Server}
     * @see [Socket.IO Server](https://socket.io/docs/v4/server-instance/)
     */
    io;
    /**
     * Constructor for the API class.
     * Initializes the Express application, HTTP server, and Socket.IO server.
     * Also calls methods to configure middleware and routes.
     *
     * @constructor
     */
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
            transports: ["websocket", "polling"],
            connectTimeout: 25000,
            //--- SOCKET.IO OPTIONS ---//
            pingInterval: 20000,
            pingTimeout: 15000,
        });
        this.routes();
        this.middleware();
    }
    /**
     * Configures the middleware for the application.
     * Includes security headers, session management, Swagger documentation, and IP blocking.
     *
     * @private
     * @async
     * @returns {Promise<void>}
     * @see [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)
     */
    async middleware() {
        // Parse URL-encoded data
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Set EJS as the view engine
        this.app.set("view engine", "ejs");
        this.app.use(passport_1.passport.initialize());
        this.app.use(passport_1.passport.session());
        // Disable the "X-Powered-By" header for security reasons
        this.app.disable("x-powered-by");
        // Trust the first proxy (useful for reverse proxies like Nginx)
        this.app.set("trust proxy", 1);
        // Parse JSON request bodies
        this.app.use(express_1.default.json());
        // Internationalization middleware
        this.app.use(i18next_http_middleware_1.default.handle(i18n_1.default));
        // Use the router for handling application routes
        this.app.use(routes_1.router);
        // Initialize Swagger monitoring and documentation
        await (0, monitor_1.SwaggerMonitor)(this);
        // API response caching middleware
        const cache = apicache_1.default.options({
            //debug: process.env.NODE_ENV === "development" ? true : false,
            defaultDuration: "5 minutes",
            headers: {
                "X-Cache-Channel": "API",
                "X-Cache-Status": "HIT",
            },
        }).middleware;
        this.app.use(cache("5 minutes"));
        // Add security headers using Helmet
        this.app.use((0, helmet_1.default)({ contentSecurityPolicy: false, referrerPolicy: false }));
        /**
         * Middleware to assign a unique ID to each request.
         * The ID is used for tracing and debugging.
         *
         * @see [UUID v4](https://www.npmjs.com/package/uuid)
         */
        this.app.use((req, _res, next) => {
            req.id = (0, uuid_1.v4)();
            next();
        });
        /**
         * Middleware to add the request ID and response time to the response headers.
         *
         * @see [Node.js process.hrtime](https://nodejs.org/api/process.html#processhrtimetime)
         */
        this.app.use((req, res, next) => {
            const start = process.hrtime();
            req.id = req.id || (0, uuid_1.v4)();
            res.setHeader("X-Request-ID", req.id);
            res.on("finish", () => {
                if (!res.headersSent) {
                    const [seconds, nanoseconds] = process.hrtime(start);
                    const responseTime = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2);
                    res.setHeader("X-Response-Time", `${responseTime}ms`);
                }
            });
            next();
        });
        /**
         * Middleware to log and store request metrics in the database.
         * Metrics include endpoint, client ID, system, request count, errors, and latency.
         *
         * @see [Prisma Upsert](https://www.prisma.io/docs/concepts/components/prisma-client/crud#upsert)
         */
        this.app.use(async (req, res, next) => {
            const start = process.hrtime();
            const clientId = req.headers["x-client-id"];
            res.on("finish", async () => {
                const [seconds, nanoseconds] = process.hrtime(start);
                const latency = seconds * 1e3 + nanoseconds / 1e6;
                const isError = res.statusCode >= 400;
                try {
                    await main_1.main.prisma.metrics.upsert({
                        where: {
                            endpoint_clientId_system: `${req.path}-${clientId || "null"}-${req.headers["user-agent"] || "unknown"}`,
                        },
                        update: {
                            requests: { increment: 1 },
                            errors: isError ? { increment: 1 } : undefined,
                            latency: { set: latency },
                        },
                        create: {
                            endpoint_clientId_system: `${req.path}-${clientId || "null"}-${req.headers["user-agent"] || "unknown"}`,
                            endpoint: req.path,
                            clientId: clientId || null,
                            system: req.headers["user-agent"] || "unknown",
                            requests: 1,
                            errors: isError ? 1 : 0,
                            latency: latency,
                        },
                    });
                }
                catch (err) {
                    throw new error_extend_1.DomainError(`The metrics could not be saved: ${err.message}`);
                }
            });
            next();
        });
        /**
         * Swagger documentation endpoint.
         *
         * @see [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express)
         */
        this.app.use(config_1.config.environments.default.api.swagger.docs, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
        /**
         * IP blocking middleware.
         *
         * @see [Custom IPBlocker](./interfaces/messaging/broker/administrator)
         */
        this.app.use(async (req, res, next) => {
            const middleware = await administrator_1.IPBlocker.getInstance().getMiddleware();
            middleware(req, res, next);
        });
    }
    /**
     * Configures the routes for the application.
     * Includes session management, static file serving, and WebSocket connection handling.
     *
     * @private
     * @async
     * @returns {Promise<void>}
     * @see [Express Routing](https://expressjs.com/en/guide/routing.html)
     */
    async routes() {
        const environments = config_1.config.environments.default;
        /**
         * Session management configuration.
         * Uses SQLite as the session store.
         *
         * @see [express-session](https://www.npmjs.com/package/express-session)
         * @see [connect-sqlite3](https://www.npmjs.com/package/connect-sqlite3)
         */
        this.app.use((0, express_session_1.default)({
            secret: process.env.WEB_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { maxAge: 3600000 / 2, secure: false },
            rolling: true,
            store: new (require("connect-sqlite3")(express_session_1.default))({
                db: `${environments.database.sessions.name}.sqlite`,
                dir: `${environments.database.sessions.url}`,
            }),
            genid() {
                return (0, uuid_1.v4)();
            },
        }));
        // --- SOCKET.IO: ONLINE USERS FOR GLOBAL CHAT ---
        /**
         * @typedef {Object} OnlineUser
         * @property {any} user - The user object.
         * @property {Set<string>} sockets - Set of socket IDs associated with the user.
         */
        const onlineUsers = new Map();
        /**
         * Socket.IO connection event handler.
         * Handles user registration, online user listing, disconnection, global chat, and ticketing.
         *
         * @see [Socket.IO Events](https://socket.io/docs/v4/server-api/#event-connection)
         */
        this.io.on("connection", (socket) => {
            /**
             * Register a user as online.
             * Emits the list of online users and sends chat history.
             *
             * @event register
             */
            socket.on("register", async (user) => {
                if (!onlineUsers.has(user.id)) {
                    onlineUsers.set(user.id, { user, sockets: new Set() });
                }
                onlineUsers.get(user.id).sockets.add(socket.id);
                // Emit only unique users
                this.io.emit("user:online", Array.from(onlineUsers.values()).map((u) => u.user));
                // --- SEND GLOBAL CHAT HISTORY TO CONNECTED USER ---
                /**
                 * Fetches the last 50 messages from the global chat.
                 *
                 * @see [Prisma findMany](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany)
                 */
                const history = await main_1.main.prisma.globalChatMessage.findMany({
                    orderBy: { createdAt: "asc" },
                    take: 50,
                });
                socket.emit("global:history", history.map((msg) => ({
                    content: msg.content,
                    senderId: msg.userId,
                    senderName: msg.username,
                    senderAvatar: msg.avatar,
                    timestamp: msg.createdAt,
                })));
            });
            /**
             * Request the list of online users.
             *
             * @event user:list
             */
            socket.on("user:list", () => {
                socket.emit("user:online", Array.from(onlineUsers.values()).map((u) => u.user));
            });
            /**
             * Handle user disconnection.
             * Removes the socket from the user's set and updates the online user list.
             *
             * @event disconnect
             */
            socket.on("disconnect", () => {
                // Find the user by socket.id
                for (const [userId, entry] of onlineUsers.entries()) {
                    entry.sockets.delete(socket.id);
                    if (entry.sockets.size === 0) {
                        onlineUsers.delete(userId);
                    }
                }
                this.io.emit("user:online", Array.from(onlineUsers.values()).map((u) => u.user));
            });
            /**
             * Handle sending a global chat message.
             * Saves the message to the database and emits it to all clients.
             *
             * @event global:message
             */
            socket.on("global:message", async (msg) => {
                // Find the user by socket.id
                let userData;
                for (const entry of onlineUsers.values()) {
                    if (entry.sockets.has(socket.id)) {
                        userData = entry.user;
                        break;
                    }
                }
                const message = {
                    content: msg.content,
                    senderId: userData?.id || msg.senderId,
                    senderName: userData?.name || msg.senderName,
                    senderAvatar: userData?.avatar || msg.senderAvatar,
                    timestamp: new Date().toISOString(),
                };
                // Save to the database
                await main_1.main.prisma.globalChatMessage.create({
                    data: {
                        userId: message.senderId,
                        username: message.senderName,
                        avatar: message.senderAvatar,
                        content: message.content,
                        createdAt: new Date(message.timestamp),
                    },
                });
                this.io.emit("global:message", message);
            });
            /**
             * Create a new support ticket.
             * Validates input and stores the ticket in the database.
             *
             * @event ticket:create
             * @param {object} data - Ticket data.
             * @param {function} callback - Callback to return the result.
             */
            socket.on("ticket:create", async (data, callback) => {
                try {
                    // Basic validation
                    if (!data.userId || !data.reason) {
                        return callback?.({ success: false, message: "Missing required data" });
                    }
                    // Create ticket in the database
                    const ticket = await main_1.main.prisma.ticketUser.create({
                        data: {
                            userId: data.userId,
                            guildId: data.guildId || null,
                            channelId: data.channelId || null,
                            reason: data.reason,
                            status: "OPEN",
                            ticketId: data.ticketId || (0, uuid_1.v4)(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    });
                    // Emit event to all clients
                    this.io.emit("ticket:created", ticket);
                    callback?.({ success: true, ticket });
                }
                catch (error) {
                    callback?.({ success: false, message: error.message });
                }
            });
            /**
             * Add a message to a support ticket.
             * Validates input, checks ticket existence, and stores the message.
             *
             * @event ticket:message
             * @param {object} data - Message data.
             * @param {function} callback - Callback to return the result.
             */
            socket.on("ticket:message", async (data, callback) => {
                try {
                    if (!data.ticketId || !data.content) {
                        return callback?.({ success: false, message: "Missing required data" });
                    }
                    // Find ticket
                    const ticket = await main_1.main.prisma.ticketUser.findUnique({
                        where: { ticketId: data.ticketId },
                    });
                    if (!ticket) {
                        return callback?.({ success: false, message: "Ticket not found" });
                    }
                    // Get actual user data from the connected socket
                    let userData;
                    for (const entry of onlineUsers.values()) {
                        if (entry.sockets.has(socket.id)) {
                            userData = entry.user;
                            break;
                        }
                    }
                    const message = await main_1.main.prisma.ticketMessage.create({
                        data: {
                            ticketId: data.ticketId,
                            senderId: userData?.id || data.senderId,
                            senderName: userData?.name || data.senderName || "User",
                            senderAvatar: userData?.avatar || data.senderAvatar || null,
                            content: data.content,
                            timestamp: new Date(),
                        },
                    });
                    // Emit event to all clients
                    this.io.emit("ticket:message", { ticketId: data.ticketId, message });
                    callback?.({ success: true, message });
                }
                catch (error) {
                    callback?.({ success: false, message: error.message });
                }
            });
            /**
             * Update the status of a support ticket (close, reopen, etc.).
             *
             * @event ticket:update
             * @param {object} data - Update data.
             * @param {function} callback - Callback to return the result.
             */
            socket.on("ticket:update", async (data, callback) => {
                try {
                    if (!data.ticketId || !data.status) {
                        return callback?.({ success: false, message: "Missing required data" });
                    }
                    const ticket = await main_1.main.prisma.ticketUser.update({
                        where: { ticketId: data.ticketId },
                        data: {
                            status: data.status,
                            closedBy: data.closedBy || null,
                            closedAt: data.status === "CLOSED" ? new Date() : null,
                            updatedAt: new Date(),
                        },
                    });
                    // Emit event to all clients
                    this.io.emit("ticket:updated", ticket);
                    callback?.({ success: true, ticket });
                }
                catch (error) {
                    callback?.({ success: false, message: error.message });
                }
            });
        });
        /**
         * Serve static files for documentation.
         *
         * @see [Express static middleware](https://expressjs.com/en/starter/static-files.html)
         */
        this.app.use("/documentation", express_1.default.static(path_1.default.join(__dirname, "..", "docs")));
        /**
         * Serve the main documentation HTML file.
         */
        this.app.get("/documentation", (_req, res) => {
            res.sendFile(path_1.default.join(__dirname, "..", "docs", "index.html"));
        });
        /**
         * Static file serving for public directories (css, js, assets, etc.).
         *
         * @see [Express static middleware](https://expressjs.com/en/starter/static-files.html)
         */
        this.app.set("views", path_1.default.join(__dirname, "interfaces", "http", "views"));
        const publicDir = path_1.default.join(__dirname, "interfaces", "http", "views", "public");
        const staticDirs = ["css", "scripts", "assets", "vendor", "fonts", "images", "scss"];
        staticDirs.forEach((dir) => {
            const staticPath = path_1.default.join(publicDir, dir);
            this.app.use(`/${dir}`, express_1.default.static(staticPath, {
                setHeaders: (res, filePath) => {
                    if (filePath.endsWith(".js")) {
                        res.setHeader("Content-Type", "application/javascript");
                    }
                },
            }));
        });
    }
    /**
     * Starts the API server on the configured port.
     * Logs the server's status and URL to the console upon successful startup.
     *
     * @async
     * @returns {Promise<void>}
     * @see [Node.js HTTP server listen](https://nodejs.org/api/http.html#serverlisten)
     */
    async start() {
        this.server.listen(config_1.config.environments.default.api.port, () => {
            (0, console_1.logWithLabel)("api", [
                `API Server is running on port ${config_1.config.environments.default.api.port}`,
                `  ${emojis_json_1.default.circle_check}  ${chalk_1.default.grey("API Server Started")}`,
                `  ${emojis_json_1.default.circle_check}  ${chalk_1.default.grey("API Port:")} ${config_1.config.environments.default.api.port}`,
                `  ${emojis_json_1.default.circle_check}  ${chalk_1.default.grey("API Health:")} ${this.app.get("trust proxy")}`,
            ].join("\n"));
        });
    }
}
exports.API = API;
//# sourceMappingURL=index.js.map
//# debugId=48d6abbf-abe4-5ca2-bd6b-c2c375b880bd
