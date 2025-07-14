import apicache from "apicache";
import chalk from "chalk";
//import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import session from "express-session";
import helmet from "helmet";
import { createServer } from "http";
import i18nextMiddleware from "i18next-http-middleware";
import path from "path";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import { v4 as uuidv4 } from "uuid";

import { main } from "@/main";
import i18next from "@/shared/i18n";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";
import { DomainError } from "@utils/extends/error.extension";

import { passport } from "./adapters/external/passport";
import swaggerSetup from "./adapters/external/swagger";
import { IPBlocker } from "./interfaces/messaging/broker/administrator";
import { SwaggerMonitor } from "./shared/monitor";
import { router } from "./shared/utils/routes";

/**
 * @module API
 * @description
 * This module contains the main API server class for the Nebura Platform client.
 * It sets up the Express application, HTTP server, Socket.IO server, middleware, routes, and real-time features.
 *
 * @see [Express Documentation](https://expressjs.com/)
 * @see [Socket.IO Documentation](https://socket.io/docs/v4/)
 * @see [TypeDoc Documentation](https://typedoc.org/)
 */

/**
 * @interface Request
 * @description
 * Extends the Express Request interface to include a unique request ID.
 * This is used for tracing and logging purposes.
 *
 * @see [Express Request](https://expressjs.com/en/api.html#req)
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Unique identifier for the request.
       */
      id?: string;
    }
  }
}

/* const corsOptions = {
  origin: hostURL(),
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}; */

/**
 * @class API
 * @classdesc
 * Main class responsible for initializing and configuring the Nebura Platform API server.
 * This class sets up the Express application, HTTP server, and Socket.IO server.
 * It also configures middleware, routes, and other server functionalities such as session management,
 * internationalization, Swagger documentation, and real-time communication.
 *
 * @example
 * ```typescript
 * const api = new API();
 * await api.start();
 * ```
 *
 * @see {@link https://expressjs.com/ Express Documentation}
 * @see {@link https://socket.io/docs/v4/ Socket.IO Documentation}
 * @see {@link https://typedoc.org/ TypeDoc Documentation}
 */
export class API {
  /**
   * Instance of the Express application.
   * Used to define routes, middleware, and other Express-specific configurations.
   *
   * @type {Application}
   * @see {@link https://expressjs.com/en/4x/api.html#app Express Application}
   */
  public app: Application;

  /**
   * HTTP server instance created using `http.createServer`.
   * This server is used to handle incoming HTTP requests.
   *
   * @type {any}
   * @see {@link https://nodejs.org/api/http.html#class-httpserver Node.js HTTP Server}
   */
  public server: any;

  /**
   * Instance of the Socket.IO server.
   * Used to manage WebSocket connections for real-time communication.
   *
   * @type {Server}
   * @see {@link https://socket.io/docs/v4/server-instance/ Socket.IO Server}
   */
  public io: Server;

  /**
   * Constructor for the API class.
   * Initializes the Express application, HTTP server, and Socket.IO server.
   * Also calls methods to configure middleware and routes.
   *
   * @constructor
   * @example
   * ```typescript
   * const api = new API();
   * ```
   */
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
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
   * Also sets up request parsing, internationalization, caching, and request/response tracing.
   *
   * @private
   * @async
   * @returns {Promise<void>}
   * @see {@link https://expressjs.com/en/guide/using-middleware.html Express Middleware}
   */
  private async middleware(): Promise<void> {
    // Parse URL-encoded data
    this.app.use(express.urlencoded({ extended: true }));

    // Set EJS as the view engine for rendering server-side templates
    this.app.set("view engine", "ejs");
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // Disable the "X-Powered-By" header for security reasons
    this.app.disable("x-powered-by");

    // Trust the first proxy (useful for reverse proxies like Nginx)
    this.app.set("trust proxy", 1);

    // Parse JSON request bodies
    this.app.use(express.json());

    // Internationalization middleware for multi-language support
    this.app.use(i18nextMiddleware.handle(i18next));

    // Use the router for handling application routes
    this.app.use(router);

    // Initialize Swagger monitoring and documentation
    await SwaggerMonitor(this);

    // API response caching middleware using apicache
    const cache = apicache.options({
      //debug: process.env.NODE_ENV === "development" ? true : false,
      defaultDuration: "5 minutes",
      headers: {
        "X-Cache-Channel": "API",
        "X-Cache-Status": "HIT",
      },
    }).middleware;

    this.app.use(cache("5 minutes"));

    // Add security headers using Helmet
    this.app.use(
      helmet({
        contentSecurityPolicy: false,
        referrerPolicy: false,
      }),
    );

    /**
     * Middleware to assign a unique ID to each request.
     * The ID is used for tracing and debugging.
     *
     * @see {@link https://www.npmjs.com/package/uuid UUID v4}
     * @example
     * // Access the request ID in a route handler
     * app.get('/endpoint', (req, res) => {
     *   console.log(req.id); // Unique request ID
     * });
     */
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      req.id = uuidv4();
      next();
    });

    /**
     * Middleware to add the request ID and response time to the response headers.
     * This helps with tracing and performance monitoring.
     *
     * @see {@link https://nodejs.org/api/process.html#processhrtimetime Node.js process.hrtime}
     */
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = process.hrtime();
      req.id = req.id || uuidv4();
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
     * Uses Prisma's upsert to ensure metrics are updated or created as needed.
     *
     * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client/crud#upsert Prisma Upsert}
     */
    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      const start = process.hrtime();
      const clientId = req.headers["x-client-id"] as string | undefined;

      res.on("finish", async () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const latency = seconds * 1e3 + nanoseconds / 1e6;
        const isError = res.statusCode >= 400;

        try {
          await main.prisma.metrics.upsert({
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
        } catch (err: any) {
          throw new DomainError(`The metrics could not be saved: ${err.message}`);
        }
      });

      next();
    });

    /**
     * Swagger documentation endpoint.
     * Serves the OpenAPI documentation using Swagger UI Express.
     *
     * @see {@link https://www.npmjs.com/package/swagger-ui-express Swagger UI Express}
     * @example
     * // Access API docs at /api/docs (or configured path)
     * // http://localhost:PORT/api/docs
     */
    this.app.use(config.environments.default.api.swagger.docs, swaggerUi.serve, swaggerUi.setup(swaggerSetup));

    /**
     * IP blocking middleware.
     * Restricts access based on IP addresses using a custom IPBlocker.
     *
     * @see {@link ./interfaces/messaging/broker/administrator Custom IPBlocker}
     */
    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      const middleware = await IPBlocker.getInstance().getMiddleware();
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
  private async routes(): Promise<void> {
    const environments = config.environments.default;

    /**
     * Session management configuration.
     * Uses SQLite as the session store.
     *
     * @see [express-session](https://www.npmjs.com/package/express-session)
     * @see [connect-sqlite3](https://www.npmjs.com/package/connect-sqlite3)
     */
    this.app.use(
      session({
        secret: process.env.WEB_SECRET as string,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 3600000 / 2, secure: false },
        rolling: true,
        store: new (require("connect-sqlite3")(session))({
          db: `${environments.database.sessions.name}.sqlite`,
          dir: `${environments.database.sessions.url}`,
        }),
        genid() {
          return uuidv4();
        },
      }),
    );

    // --- SOCKET.IO: ONLINE USERS FOR GLOBAL CHAT ---
    /**
     * @typedef {Object} OnlineUser
     * @property {any} user - The user object.
     * @property {Set<string>} sockets - Set of socket IDs associated with the user.
     */
    const onlineUsers = new Map<string, { user: any; sockets: Set<string> }>();

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
        onlineUsers.get(user.id)!.sockets.add(socket.id);

        // Emit only unique users
        this.io.emit(
          "user:online",
          Array.from(onlineUsers.values()).map((u) => u.user),
        );

        // --- SEND GLOBAL CHAT HISTORY TO CONNECTED USER ---
        /**
         * Fetches the last 50 messages from the global chat.
         *
         * @see [Prisma findMany](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany)
         */
        const history = await main.prisma.globalChatMessage.findMany({
          orderBy: { createdAt: "asc" },
          take: 50,
        });
        socket.emit(
          "global:history",
          history.map((msg) => ({
            content: msg.content,
            senderId: msg.userId,
            senderName: msg.username,
            senderAvatar: msg.avatar,
            timestamp: msg.createdAt,
          })),
        );
      });

      /**
       * Request the list of online users.
       *
       * @event user:list
       */
      socket.on("user:list", () => {
        socket.emit(
          "user:online",
          Array.from(onlineUsers.values()).map((u) => u.user),
        );
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
        this.io.emit(
          "user:online",
          Array.from(onlineUsers.values()).map((u) => u.user),
        );
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
        await main.prisma.globalChatMessage.create({
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
          const ticket = await main.prisma.ticketUser.create({
            data: {
              userId: data.userId,
              guildId: data.guildId || null,
              channelId: data.channelId || null,
              reason: data.reason,
              status: "OPEN",
              ticketId: data.ticketId || uuidv4(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          // Emit event to all clients
          this.io.emit("ticket:created", ticket);

          callback?.({ success: true, ticket });
        } catch (error: any) {
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
          const ticket = await main.prisma.ticketUser.findUnique({
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

          const message = await main.prisma.ticketMessage.create({
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
        } catch (error: any) {
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

          const ticket = await main.prisma.ticketUser.update({
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
        } catch (error: any) {
          callback?.({ success: false, message: error.message });
        }
      });
    });

    /**
     * Serve static files for documentation.
     *
     * @see [Express static middleware](https://expressjs.com/en/starter/static-files.html)
     */
    this.app.use("/documentation", express.static(path.join(__dirname, "..", "docs")));

    /**
     * Serve the main documentation HTML file.
     */
    this.app.get("/documentation", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "..", "docs", "index.html"));
    });

    /**
     * Static file serving for public directories (css, js, assets, etc.).
     *
     * @see [Express static middleware](https://expressjs.com/en/starter/static-files.html)
     */
    this.app.set("views", path.join(__dirname, "interfaces", "http", "views"));
    const publicDir = path.join(__dirname, "interfaces", "http", "views", "public");
    const staticDirs = ["css", "scripts", "assets", "vendor", "fonts", "images", "scss"];
    staticDirs.forEach((dir): void => {
      const staticPath = path.join(publicDir, dir);
      this.app.use(
        `/${dir}`,
        express.static(staticPath, {
          setHeaders: (res, filePath) => {
            if (filePath.endsWith(".js")) {
              res.setHeader("Content-Type", "application/javascript");
            }
          },
        }),
      );
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
  public async start(): Promise<void> {
    this.server.listen(config.environments.default.api.port, () => {
      logWithLabel(
        "api",
        [
          `API Server is running on port ${config.environments.default.api.port}`,
          `  ${emojis.circle_check}  ${chalk.grey("API Server Started")}`,
          `  ${emojis.circle_check}  ${chalk.grey("API Port:")} ${config.environments.default.api.port}`,
          `  ${emojis.circle_check}  ${chalk.grey("API Health:")} ${this.app.get("trust proxy")}`,
        ].join("\n"),
      );
    });
  }
}
