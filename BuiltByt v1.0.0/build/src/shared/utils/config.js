"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="5e52e4da-1824-59f3-aed3-ff44eb53a69e")}catch(e){}}();

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.readConfigFile = readConfigFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const console_1 = require("./functions/console");
/**
 * Reads a YAML configuration file and returns its parsed contents.
 * @param {string} filename - The name of the configuration file to read.
 * @returns The parsed contents of the configuration file as type `T`.
 */
const configDir = path_1.default.resolve(__dirname, "..", "..", "..", "config");
function readConfigFile(filename) {
    const filePath = path_1.default.join(configDir, filename);
    if (!fs_1.default.existsSync(filePath)) {
        (0, console_1.logWithLabel)("error", `Configuration file ${filename} not found.`);
        process.exit(1);
    }
    if (!fs_1.default.statSync(filePath).isFile()) {
        (0, console_1.logWithLabel)("error", `${filename} is not a file.`);
        process.exit(1);
    }
    if (path_1.default.extname(filePath) !== ".yml" && path_1.default.extname(filePath) !== ".yaml") {
        (0, console_1.logWithLabel)("error", `${filename} is not a YAML file.`);
        process.exit(1);
    }
    try {
        const fileContents = fs_1.default.readFileSync(filePath, "utf8");
        return yaml_1.default.parse(fileContents);
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", `Error reading ${filename}: ${error}`);
        process.exit(1);
    }
}
const config = readConfigFile("config.yml");
exports.config = config;
//# sourceMappingURL=config.js.map
//# debugId=5e52e4da-1824-59f3-aed3-ff44eb53a69e
