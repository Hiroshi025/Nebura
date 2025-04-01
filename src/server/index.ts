import chalk from "chalk";
import express, { Application, NextFunction, Request, Response } from "express";
import session from "express-session";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";

import { IPBlocker } from "@/shared/ipBlocker";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

import { SwaggerMonitor } from "./shared/monitor";
import swaggerSetup from "./shared/swagger-doc";
import { router } from "./shared/utils/routes";

export class API {
  public app: Application;
  public server: any;
  public io: Server;
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);

    this.routes();
    this.middleware();
  }

  private async middleware() {
    this.app.use(express.urlencoded({ extended: true }));
    this.app.disable("x-powered-by");
    this.app.set("trust proxy", 1);
    this.app.use(express.json());
    this.app.use(router);

    this.app.use(helmet({ contentSecurityPolicy: false }));
    await SwaggerMonitor(this);
    this.app.use(
      config.environments.default.api.swagger.docs,
      swaggerUi.serve,
      swaggerUi.setup(swaggerSetup),
    );

    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      const middleware = await IPBlocker.getInstance().getMiddleware();
      middleware(req, res, next);
    });
  }

  private async routes() {
    const environments = config.environments.default;
    this.app.use(
      session({
        secret: environments.api.sessions.websecret,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 3600000 / 2 }, // esto es para que la sesion dure 30 minutos
        rolling: true, // esto es para que la sesion se renueve cada vez que se haga una peticion
        store: new (require("connect-sqlite3")(session))({
          db: `${environments.database.sessions.name}.sqlite`,
          dir: `${environments.database.sessions.url}`,
        }),
      }),
    );

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
  }

  public async start() {
    this.server.listen(config.environments.default.api.port, () => {
      logWithLabel(
        "api",
        [
          `API Server is running on port ${config.environments.default.api.port}`,
          `  ${emojis.circle_check}  ${chalk.grey("API Server Started")}`,
          `  ${emojis.circle_check}  ${chalk.grey("API Port:")} ${config.environments.default.api.port}`,
          `  ${emojis.circle_check}  ${chalk.grey("API URL:")} https://${config.environments.default.api.host}/`,
        ].join("\n"),
      );
    });
  }
}
