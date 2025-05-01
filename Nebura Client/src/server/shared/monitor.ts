import chalk from "chalk";
import { debug } from "node:console";
import SwaggerParser from "swagger-parser";
import swStats from "swagger-stats";

import { API } from "@/server";
import { config } from "@/shared/utils/config";
import { logWithLabel } from "@/shared/utils/functions/console";
import emojis from "@config/json/emojis.json";

/**
 * Sets up and configures Swagger monitoring and metrics for the provided API instance.
 *
 * This function validates the Swagger API specification and, if successful, enables
 * Swagger-stats middleware for monitoring API performance and metrics. It also provides
 * authentication for accessing the metrics dashboard.
 *
 * @param main - The main API instance where the middleware will be applied.
 *
 * @remarks
 * - The Swagger specification is validated using `swagger-parser`.
 * - Metrics are exposed via `swagger-stats` middleware.
 * - Authentication is required to access the metrics dashboard.
 *
 * @example
 * ```typescript
 * import { SwaggerMonitor } from "@/server/shared/monitor";
 * import { API } from "@/server";
 *
 * const api = new API();
 * SwaggerMonitor(api);
 * ```
 */
export const SwaggerMonitor = (main: API) => {
  const projectconfig = config.environments.default.api.swagger;
  let swaggerSpec = null;

  // Validate the Swagger API specification
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
          name: projectconfig.name,
          version: projectconfig.version,
          hostname: `${projectconfig.url}`,
          timelineBucketDuration: 60000,
          swaggerSpec: swaggerSpec,
          uriPath: projectconfig.url,
          durationBuckets: [50, 100, 200, 500, 1000, 5000],
          requestSizeBuckets: [500, 5000, 15000, 50000],
          responseSizeBuckets: [600, 6000, 6000, 60000],
          apdexThreshold: 50,
          onResponseFinish: function (_req, _res, rrr) {
            debug("onResponseFinish: %s", JSON.stringify(rrr));
          },
          authentication: true,
          onAuthenticate(_req, username, password) {
            return username === projectconfig.auth.name && password === projectconfig.auth.password;
          },
        }),
      );
    } else {
      // Log an error if the Swagger API specification fails validation
      logWithLabel("custom", `Swagger API: ${err}`, {
        customLabel: "Swagger",
        context: {
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
  });
};
