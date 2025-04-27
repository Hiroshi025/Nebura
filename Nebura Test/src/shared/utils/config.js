"use strict";
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
    try {
        const fileContents = fs_1.default.readFileSync(filePath, "utf8");
        return yaml_1.default.parse(fileContents);
    }
    catch (error) {
        (0, console_1.logWithLabel)("error", `Error reading ${filename}: ${error}`);
        process.exit(1);
    }
}
// Determina el archivo de configuración según NODE_ENV
const configFile = `config.yml`;
const config = readConfigFile(configFile);
exports.config = config;
