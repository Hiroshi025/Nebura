"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesLoaded = exports.labelNames = exports.labelColors = void 0;
const chalk_1 = __importDefault(require("chalk"));
/**
 * A mapping of log labels to their corresponding colors.
 * Each label is associated with a specific color for better visual distinction in logs.
 */
exports.labelColors = {
    error: chalk_1.default.redBright, // Bright red for error messages.
    success: chalk_1.default.greenBright, // Bright green for success messages.
    debug: chalk_1.default.magentaBright, // Bright magenta for debug messages.
    info: chalk_1.default.blueBright, // Bright blue for informational messages.
    maintenance: chalk_1.default.hex("#FFA500"), // Orange for maintenance messages.
    warn: chalk_1.default.yellowBright, // Bright yellow for warning messages.
    cache: chalk_1.default.hex("#5c143b"), // Custom dark purple for cache messages.
    api: chalk_1.default.hex("#FFA500"), // Orange for API-related messages.
    IPBlocker: chalk_1.default.hex("#FFA500"), // Orange for IP blocker messages.
    LicenseIP: chalk_1.default.hex("#FFA500"), // Orange for license IP messages.
    cluster: chalk_1.default.hex("#EB5C2D"), // Custom orange-red for cluster messages.
};
/**
 * A mapping of log labels to their corresponding display names.
 * These names are used as prefixes in log messages for better readability.
 */
exports.labelNames = {
    error: "Error", // Display name for error messages.
    success: "Success", // Display name for success messages.
    debug: "Debug", // Display name for debug messages.
    info: "Info", // Display name for informational messages.
    maintenance: "Maintenance", // Display name for maintenance messages.
    warn: "Warn", // Display name for warning messages.
    cache: "Cache", // Display name for cache messages.
    IPBlocker: "IP", // Display name for IP blocker messages.
    api: "API", // Display name for API-related messages.
    LicenseIP: "License", // Display name for license IP messages.
    cluster: "Cluster", // Display name for cluster messages.
};
/**
 * A list of file paths that have been loaded.
 * Each entry in the array represents the path of a loaded file or `undefined` if no file was loaded.
 */
exports.filesLoaded = [];
