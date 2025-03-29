import chalk from "chalk";
import { debug } from "node:console";
import SwaggerParser from "swagger-parser";
import swStats from "swagger-stats";

import { API } from "@/server";
import { logWithLabel } from "@/shared/lib/functions/console";
import { config } from "@/shared/utils/config";
import emojis from "@config/json/emojis.json";

export const SwaggerMonitor = (main: API) => {
  const projectconfig = config.environments.default.api.swagger;
  let swaggerSpec = null;
  SwaggerParser.prototype.validate(projectconfig.local, function (err, api) {
    if (!err) {
      logWithLabel(
        "api",
        [
          `Monitoring API: ${api?.info.title} v${api?.info.version}`,
          `  ${emojis.circle_check}  ${chalk.grey("Swagger API Loaded")}`,
          `  ${emojis.circle_check}  ${chalk.grey("Swagger API Metrics")}`,
        ].join("\n"),
      );
      swaggerSpec = api;
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
      logWithLabel("custom", `Swagger API: ${err}`, "Api");
      return;
    }
  });
};
