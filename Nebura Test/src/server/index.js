"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API = void 0;
const apicache_1 = __importDefault(require("apicache"));
const chalk_1 = __importDefault(require("chalk"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const uuid_1 = require("uuid");
const ipBlocker_1 = require("../shared/class/ipBlocker");
const config_1 = require("../shared/utils/config");
const console_1 = require("../shared/utils/functions/console");
const i18n_1 = __importDefault(require("./shared/i18n"));
const emojis_json_1 = __importDefault(require("../../config/json/emojis.json"));
const monitor_1 = require("./shared/monitor");
const swagger_doc_1 = __importDefault(require("./shared/swagger-doc"));
const routes_1 = require("./shared/utils/routes");
/**
 * Main class responsible for initializing and configuring the API server.
 * This class sets up the Express application, HTTP server, and Socket.IO server.
 * It also configures middleware, routes, and other server functionalities.
 */
class API {
    /**
     * Instance of the Express application.
     * Used to define routes, middleware, and other Express-specific configurations.
     */
    app;
    /**
     * HTTP server instance created using `http.createServer`.
     * This server is used to handle incoming HTTP requests.
     */
    server;
    /**
     * Instance of the Socket.IO server.
     * Used to manage WebSocket connections for real-time communication.
     */
    io;
    /**
     * Constructor for the API class.
     * Initializes the Express application, HTTP server, and Socket.IO server.
     * Also calls methods to configure middleware and routes.
     */
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server);
        this.routes();
        /**
         * @description Middleware for the API server.
         * This method sets up various middleware functions for the server, including:
         * - Parsing URL-encoded data
         */
        this.middleware();
    }
    /**
     * Configures the middleware for the application.
     * Includes security headers, session management, Swagger documentation, and IP blocking.
     *
     * @private
     * @async
     */
    async middleware() {
        // Parse URL-encoded data
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Disable the "X-Powered-By" header for security reasons
        this.app.disable("x-powered-by");
        // Trust the first proxy (useful for reverse proxies like Nginx)
        this.app.set("trust proxy", 1);
        // Parse JSON request bodies
        this.app.use(express_1.default.json());
        this.app.use(i18next_http_middleware_1.default.handle(i18n_1.default));
        // Use the router for handling application routes
        this.app.use(routes_1.router);
        // Serve static files from the public directory
        // Configuración del cliente de Redis
        /*     const redisConfig = {
          url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
          database: Number(process.env.REDIS_DB),
          password: process.env.REDIS_PASSWORD,
        }; */
        //const redisClient = new Redis(redisConfig);
        // Manejar errores de conexión de Redis
        /*     redisClient.on("error", (err) => {
          console.error(chalk.red(`[Redis Error] ${err.message}`));
          logWithLabel("custom", `Error connecting to Redis: ${err.message}`, "Redis");
        }); */
        // Manejar eventos de conexión exitosa
        /*     redisClient.on("connect", () => {
          console.log(chalk.green("[Redis] Connected successfully"));
          logWithLabel("custom", "Redis connection established successfully", "Redis");
        }); */
        const cache = apicache_1.default.options({
            debug: true,
            //redisClient, Usar el cliente de Redis conectado
            defaultDuration: "5 minutes",
            headers: {
                "X-Cache-Channel": "API",
                "X-Cache-Status": "HIT",
            },
        }).middleware;
        this.app.use(cache("5 minutes"));
        // Add security headers using Helmet
        this.app.use((0, helmet_1.default)({ contentSecurityPolicy: false, referrerPolicy: false }));
        // Assign a unique ID to each request
        this.app.use((req, _res, next) => {
            req.id = (0, uuid_1.v4)();
            next();
        });
        // Add the request ID and response time to the response headers
        this.app.use((req, res, next) => {
            const start = process.hrtime(); // Start measuring time
            req.id = req.id || (0, uuid_1.v4)(); // Ensure the request ID is set
            res.setHeader("X-Request-ID", req.id); // Add the request ID to the response headers
            res.on("finish", () => {
                if (!res.headersSent) {
                    // Ensure headers are not modified after being sent
                    const [seconds, nanoseconds] = process.hrtime(start);
                    const responseTime = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2); // Convert to milliseconds
                    res.setHeader("X-Response-Time", `${responseTime}ms`); // Add response time to the headers
                }
            });
            next();
        });
        // Initialize Swagger monitoring and documentation
        await (0, monitor_1.SwaggerMonitor)(this);
        this.app.use(config_1.config.environments.default.api.swagger.docs, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_doc_1.default));
        // Add IP blocking middleware
        this.app.use(async (req, res, next) => {
            const middleware = await ipBlocker_1.IPBlocker.getInstance().getMiddleware();
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
    async routes() {
        const environments = config_1.config.environments.default;
        // Configure session management
        this.app.use((0, express_session_1.default)({
            secret: environments.api.sessions.websecret, // Secret key for signing the session ID
            resave: false, // Prevents resaving sessions that haven't been modified
            saveUninitialized: false, // Prevents saving uninitialized sessions
            cookie: { maxAge: 3600000 / 2 }, // Session expiration time (30 minutes)
            rolling: true, // Renews the session expiration time on each request
            store: new (require("connect-sqlite3")(express_session_1.default))({
                db: `${environments.database.sessions.name}.sqlite`, // SQLite database file for session storage
                dir: `${environments.database.sessions.url}`, // Directory for the SQLite database
            }),
        }));
        // Handle WebSocket connections
        this.io.on("connection", (socket) => {
            (0, console_1.logWithLabel)("api", [
                `Socket Connection Established: ${socket.id}`,
                `  ${emojis_json_1.default.circle_check}  ${chalk_1.default.grey("Socket Connected")}`,
                `  ${emojis_json_1.default.circle_check}  ${chalk_1.default.grey("Socket ID:")} ${socket.id}`,
            ].join("\n"));
        });
        // Serve static files for documentation
        this.app.use("/documentation", express_1.default.static(path_1.default.join(__dirname, "..", "..", "docs")));
        // Serve the main documentation HTML file
        this.app.get("/documentation", (_req, res) => {
            res.sendFile(path_1.default.join(__dirname, "..", "..", "docs", "index.html"));
        });
        /* This part of the code is setting up static file serving for different directories like css, js, img,
        assets, and json. Here's a breakdown of what it does: */
        this.app.set("views", path_1.default.join(__dirname, "view"));
        const publicDir = path_1.default.join(__dirname, "view", "public");
        const staticDirs = ["css", "js", "assets", "vendor", "fonts", "images", "scss"];
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
