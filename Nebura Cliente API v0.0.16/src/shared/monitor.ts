import chalk from "chalk";
//import { Request, Response } from "express";
import { debug } from "node:console";
import SwaggerParser from "swagger-parser";
import swStats from "swagger-stats";

import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

import { API } from "../";

/**
 * Sets up and configures Swagger monitoring and metrics for the provided API instance.
 *
 * This function validates the Swagger API specification and, if successful, enables
 * [swagger-stats](https://github.com/slanatech/swagger-stats) middleware for monitoring API performance and metrics.
 * It also provides authentication for accessing the metrics dashboard.
 *
 * @param main - The main {@link API} instance where the middleware will be applied.
 *
 * @remarks
 * - The Swagger specification is validated using [swagger-parser](https://github.com/APIDevTools/swagger-parser).
 * - Metrics are exposed via [swagger-stats](https://github.com/slanatech/swagger-stats) middleware.
 * - Authentication is required to access the metrics dashboard.
 * - The middleware is configured using the project's Swagger configuration.
 *
 * @example
 * ```typescript
 * import { SwaggerMonitor } from "@/server/shared/monitor";
 * import { API } from "@/server";
 *
 * const api = new API();
 * SwaggerMonitor(api);
 * ```
 *
 * @see {@link https://github.com/slanatech/swagger-stats swagger-stats}
 * @see {@link https://github.com/APIDevTools/swagger-parser swagger-parser}
 */
export const SwaggerMonitor = (main: API) => {
  /**
   * Project Swagger configuration loaded from environment settings.
   */
  const projectconfig = config.environments.default.api.swagger;
  let swaggerSpec = null;

  // Validate the Swagger API specification using swagger-parser
  SwaggerParser.prototype.validate(projectconfig.local, function (err, api) {
    if (!err) {
      // Log successful loading of the Swagger API
      logWithLabel(
        "api",
        [
          `Monitoring API: ${api?.info.title} v${api?.info.version}`,
          `  ${emojis.circle_check}  ${chalk.grey("Swagger API Loaded")}`,
          `  ${emojis.circle_check}  ${chalk.grey("Swagger API Metrics")}`,
        ].join("\n"),
      );

      swaggerSpec = api;

      // Configure and apply the swagger-stats middleware
      main.app.use(
        swStats.getMiddleware({
          /**
           * Name of the API, as defined in the project configuration.
           */
          name: projectconfig.name,
          /**
           * Version of the API, as defined in the project configuration.
           */
          version: projectconfig.version,
          /**
           * Hostname or base URL for the API metrics dashboard.
           */
          hostname: projectconfig.url,
          /**
           * Duration of timeline buckets in milliseconds.
           */
          timelineBucketDuration: 60000,
          /**
           * The validated Swagger specification object.
           */
          swaggerSpec: swaggerSpec,
          /**
           * Path where the metrics dashboard will be available.
           */
          uriPath: projectconfig.url,
          /**
           * Buckets for request duration metrics (in ms).
           */
          durationBuckets: [50, 100, 200, 500, 1000, 5000],
          /**
           * Buckets for request size metrics (in bytes).
           */
          requestSizeBuckets: [500, 5000, 15000, 50000],
          /**
           * Buckets for response size metrics (in bytes).
           */
          responseSizeBuckets: [600, 6000, 6000, 60000],
          /**
           * Apdex threshold (in ms).
           */
          apdexThreshold: 50,
          /**
           * Callback executed when a response is finished.
           * @param _req - The request object.
           * @param _res - The response object.
           * @param rrr - The response result record.
           */
          onResponseFinish: function (_req, _res, rrr) {
            debug("onResponseFinish: %s", JSON.stringify(rrr));
          },
          /**
           * Enables authentication for the metrics dashboard.
           */
          authentication: true,
          /**
           * Authentication callback for the metrics dashboard.
           * @param _req - The request object.
           * @param username - The username provided.
           * @param password - The password provided.
           * @returns `true` if authentication is successful, otherwise `false`.
           */
          onAuthenticate(_req, username, password) {
            return username === projectconfig.auth.name && password === projectconfig.auth.password;
          },
        }),
      );

      // Optionally, expose core stats at the metrics endpoint
      /* main.app.get(projectconfig.url, async (_req: Request, res: Response) => {
        res.send(swStats.getCoreStats());
      }); */
    } else {
      // Log an error if the Swagger API specification fails validation
      logWithLabel("custom", `Swagger API: ${err}`, {
        customLabel: "Swagger",
      });
      return;
    }
  });
};
