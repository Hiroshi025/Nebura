"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerMonitor = void 0;
const chalk_1 = __importDefault(require("chalk"));
const node_console_1 = require("node:console");
const swagger_parser_1 = __importDefault(require("swagger-parser"));
const swagger_stats_1 = __importDefault(require("swagger-stats"));
const config_1 = require("../../shared/utils/config");
const console_1 = require("../../shared/utils/functions/console");
const emojis_json_1 = __importDefault(require("../../../config/json/emojis.json"));
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
 * import { SwaggerMonitor } from "../../server/shared/monitor";
 * import { API } from "../../server";
 *
 * const api = new API();
 * SwaggerMonitor(api);
 * ```
 */
const SwaggerMonitor = (main) => {
    const projectconfig = config_1.config.environments.default.api.swagger;
    let swaggerSpec = null;
    // Validate the Swagger API specification
    swagger_parser_1.default.prototype.validate(projectconfig.local, function (err, api) {
        if (!err) {
            // Log successful loading of the Swagger API
            (0, console_1.logWithLabel)("api", [
                `Monitoring API: ${api?.info.title} v${api?.info.version}`,
                `  ${emojis_json_1.default.circle_check}  ${chalk_1.default.grey("Swagger API Loaded")}`,
                `  ${emojis_json_1.default.circle_check}  ${chalk_1.default.grey("Swagger API Metrics")}`,
            ].join("\n"));
            swaggerSpec = api;
            // Configure and apply the swagger-stats middleware
            main.app.use(swagger_stats_1.default.getMiddleware({
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
                    (0, node_console_1.debug)("onResponseFinish: %s", JSON.stringify(rrr));
                },
                authentication: true,
                onAuthenticate(_req, username, password) {
                    return username === projectconfig.auth.name && password === projectconfig.auth.password;
                },
            }));
        }
        else {
            // Log an error if the Swagger API specification fails validation
            (0, console_1.logWithLabel)("custom", `Swagger API: ${err}`, "Api");
            return;
        }
    });
};
exports.SwaggerMonitor = SwaggerMonitor;
