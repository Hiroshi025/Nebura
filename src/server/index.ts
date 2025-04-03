import chalk from "chalk";
import express, { Application, NextFunction, Request, Response } from "express";
import session from "express-session";
import helmet from "helmet";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";

import { IPBlocker } from "@/shared/ipBlocker";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

import { SwaggerMonitor } from "./shared/monitor";
import swaggerSetup from "./shared/swagger-doc";
import { router } from "./shared/utils/routes";

/**
 * Main class responsible for initializing and configuring the API server.
 * This class sets up the Express application, HTTP server, and Socket.IO server.
 * It also configures middleware, routes, and other server functionalities.
 */
export class API {
  /**
   * Instance of the Express application.
   * Used to define routes, middleware, and other Express-specific configurations.
   */
  public app: Application;

  /**
   * HTTP server instance created using `http.createServer`.
   * This server is used to handle incoming HTTP requests.
   */
  public server: any;

  /**
   * Instance of the Socket.IO server.
   * Used to manage WebSocket connections for real-time communication.
   */
  public io: Server;

  /**
   * Constructor for the API class.
   * Initializes the Express application, HTTP server, and Socket.IO server.
   * Also calls methods to configure middleware and routes.
   */
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);

    this.routes();
    this.middleware();
  }

  /**
   * Configures the middleware for the application.
   * Includes security headers, session management, Swagger documentation, and IP blocking.
   *
   * @private
   * @async
   */
  private async middleware() {
    // Parse URL-encoded data
    this.app.use(express.urlencoded({ extended: true }));

    // Disable the "X-Powered-By" header for security reasons
    this.app.disable("x-powered-by");

    // Trust the first proxy (useful for reverse proxies like Nginx)
    this.app.set("trust proxy", 1);

    // Parse JSON request bodies
    this.app.use(express.json());

    // Use the router for handling application routes
    this.app.use(router);

    // Add security headers using Helmet
    this.app.use(helmet({ contentSecurityPolicy: false }));

    // Initialize Swagger monitoring and documentation
    await SwaggerMonitor(this);
    this.app.use(
      config.environments.default.api.swagger.docs,
      swaggerUi.serve,
      swaggerUi.setup(swaggerSetup),
    );

    // Add IP blocking middleware
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
   */
  private async routes() {
    const environments = config.environments.default;

    // Configure session management
    this.app.use(
      session({
        secret: environments.api.sessions.websecret, // Secret key for signing the session ID
        resave: false, // Prevents resaving sessions that haven't been modified
        saveUninitialized: false, // Prevents saving uninitialized sessions
        cookie: { maxAge: 3600000 / 2 }, // Session expiration time (30 minutes)
        rolling: true, // Renews the session expiration time on each request
        store: new (require("connect-sqlite3")(session))({
          db: `${environments.database.sessions.name}.sqlite`, // SQLite database file for session storage
          dir: `${environments.database.sessions.url}`, // Directory for the SQLite database
        }),
      }),
    );

    // Handle WebSocket connections
    this.io.on("connection", (socket) => {
      logWithLabel(
        "api",
        [
          `Socket Connection Established: ${socket.id}`,
          `  ${emojis.circle_check}  ${chalk.grey("Socket Connected")}`,
          `  ${emojis.circle_check}  ${chalk.grey("Socket ID:")} ${socket.id}`,
        ].join("\n"),
      );
    });

    // Serve static files for documentation
    this.app.use("/documentation", express.static(path.join(__dirname, "..", "..", "docs")));

    // Serve the main documentation HTML file
    this.app.get("/documentation", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "..", "..", "docs", "index.html"));
    });
  }

  /**
   * Starts the API server on the configured port.
   * Logs the server's status and URL to the console upon successful startup.
   *
   * @async
   */
  public async start() {
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
