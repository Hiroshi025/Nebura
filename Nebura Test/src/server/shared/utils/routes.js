"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const chalk_1 = __importDefault(require("chalk"));
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const console_1 = require("../../../shared/utils/functions/console");
/**
 * Recursively retrieves all subdirectories inside the specified base directory.
 *
 * @param baseDir - The base directory to scan for subdirectories.
 * @returns An array of absolute paths to the subdirectories.
 */
function getSubdirectories(baseDir) {
    const entries = fs_1.default.readdirSync(baseDir, { withFileTypes: true }); // Read directory contents with file type information.
    const directories = entries
        .filter((dirent) => dirent.isDirectory()) // Filter only directories.
        .map((dirent) => path_1.default.resolve(baseDir, dirent.name)); // Resolve full paths of the directories.
    // Recursively get subdirectories for each directory.
    const subdirectories = directories.flatMap((dir) => getSubdirectories(dir));
    return [...directories, ...subdirectories]; // Combine current directories with their subdirectories.
}
/**
 * Array of directories containing route files.
 * Automatically includes all subdirectories inside the `routes` directory.
 */
const routesDirs = getSubdirectories(path_1.default.resolve(__dirname, "../../interfaces/http/routes"));
/**
 * Array to keep track of successfully loaded route files and their respective routes.
 * Each entry contains the file name and an array of route objects with method and path.
 */
const routerLoadeds = [];
/**
 * Express Router instance that will be populated with the loaded routes.
 * This router will be used to register all the routes dynamically.
 */
const router = (0, express_1.Router)();
exports.router = router;
/**
 * Asynchronously loads all route files from the specified directories.
 *
 * This function scans the directories defined in `routesDirs`, imports the route files,
 * and registers their routes to the Express router. It also logs the loading process
 * and tracks the loaded routes for debugging purposes.
 *
 * @async
 * @function
 */
(async () => {
    const start = performance.now(); // Start measuring the time taken to load routes.
    (0, console_1.logWithLabel)("custom", [
        `Loading Routes-Endpoints Express`,
        chalk_1.default.grey(`  🟡  Loading Routes-Endpoints Express...`),
        chalk_1.default.grey(`  📂  Directories Found: ${routesDirs.length}`),
    ].join("\n"), "Express");
    // Process each directory containing route files.
    for (const routesDir of routesDirs) {
        const files = fs_1.default
            .readdirSync(routesDir) // Read all files in the directory.
            .filter((file) => file.endsWith(".routes.ts") || file.endsWith(".routes.js")); // Filter route files.
        // Load the routes asynchronously.
        const imports = files.map(async (file) => {
            const modulePath = path_1.default.join(routesDir, file); // Construct the full path to the module.
            try {
                const module = await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s))); // Dynamically import the module.
                if (module.default) {
                    const routesHandler = module.default; // Get the default export (route handler).
                    routesHandler({ app: router }); // Register the routes to the Express router.
                    routerLoadeds.push({ file, routes: [] }); // Track the loaded route file.
                }
                else {
                    (0, console_1.logWithLabel)("custom", `No default export found in ${modulePath}`, "Express"); // Log missing default export.
                }
            }
            catch (err) {
                (0, console_1.logWithLabel)("custom", `Error while importing ${modulePath}: ${err}`, "Express"); // Log errors during import.
            }
        });
        // Wait for all route files in the directory to be imported.
        await Promise.all(imports);
    }
    const end = performance.now(); // End measuring the time taken to load routes.
    // Log the summary of the route loading process.
    (0, console_1.logWithLabel)("custom", [
        `Loading Routes-Endpoints Express`,
        chalk_1.default.grey(`  ✅  Finished Loading Routes-Endpoints Express`),
        chalk_1.default.grey(`  🟢  Routes-Endpoints Loaded Successfully: ${routerLoadeds.length}`),
        chalk_1.default.grey(`  🕛  Took: ${((end - start) / 1000).toFixed(2)}s`),
    ].join("\n"), "Express");
})();
