"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalCleanup = globalCleanup;
const emojis_json_1 = __importDefault(require("../../../config/json/emojis.json"));
const console_1 = require("./functions/console");
//const taskService = new TaskService();
/**
 * Executes a cleanup task and handles logging and errors.
 * @param taskName The name of the task being executed.
 * @param cleanupFunction The cleanup function to execute.
 */
async function globalCleanup(taskName, cleanupFunction) {
    try {
        const deletedCount = await cleanupFunction();
        (0, console_1.logWithLabel)("custom", [
            `${taskName} cleanup completed.`,
            `  ${emojis_json_1.default.database} Deleted items: ${deletedCount}`,
        ].join("\n"), "Tasks");
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", `${error}`);
        console.error(error);
    }
}
// Run the cleanup task for global tasks.
//executeGlobalCleanup("Global Tasks", () => taskService.cleanUpTasks());
