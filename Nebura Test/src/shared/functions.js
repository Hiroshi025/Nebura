"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostURL = hostURL;
const config_1 = require("./utils/config");
function hostURL() {
    const host = config_1.config.environments.default.api.host === "localhost"
        ? "http://localhost"
        : `https://${config_1.config.environments.default.api.host}`;
    const port = config_1.config.environments.default.api.port;
    if (config_1.config.environments.default.api.host === "localhost") {
        return `${host}:${port}`;
    }
    return `${host}`;
}
