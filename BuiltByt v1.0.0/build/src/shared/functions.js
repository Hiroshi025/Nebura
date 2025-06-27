"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="5ae6dd92-9994-501d-8213-d4dc8bb0acd9")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeCompare = safeCompare;
exports.hostURL = hostURL;
exports.globalCleanup = globalCleanup;
const crypto_1 = require("crypto");
const emojis_json_1 = __importDefault(require("../../config/json/emojis.json"));
const config_1 = require("./utils/config");
const console_1 = require("./utils/functions/console");
/**
 * Compares two strings in a timing-safe manner to prevent timing attacks.
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns True if the strings are equal, false otherwise.
 */
function safeCompare(a, b) {
    try {
        return (0, crypto_1.timingSafeEqual)(Buffer.from(a), Buffer.from(b));
    }
    catch {
        return false;
    }
}
/**
 * Constructs the base URL for the API host, including protocol and port if necessary.
 *
 * @returns The constructed host URL as a string.
 */
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
/**
 * Executes a cleanup task and logs the result.
 *
 * @param taskName - The name of the cleanup task.
 * @param cleanupFunction - An asynchronous function that performs the cleanup and returns the number of deleted items.
 * @returns A Promise that resolves when the cleanup and logging are complete.
 */
async function globalCleanup(taskName, cleanupFunction) {
    try {
        const deletedCount = await cleanupFunction();
        (0, console_1.logWithLabel)("custom", [
            `${taskName} cleanup completed.`,
            `  ${emojis_json_1.default.database} Deleted items: ${deletedCount}`,
        ].join("\n"), {
            customLabel: "Tasks",
        });
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", `${error}`);
        console.error(error);
    }
}
//const taskService = new TaskService();
// Run the cleanup task for global tasks.
//executeGlobalCleanup("Global Tasks", () => taskService.cleanUpTasks());
//# sourceMappingURL=functions.js.map
//# debugId=5ae6dd92-9994-501d-8213-d4dc8bb0acd9
