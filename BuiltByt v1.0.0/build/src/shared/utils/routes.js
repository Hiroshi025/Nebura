"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="4a2b60c3-6a94-5495-a853-3fb51c7607e2")}catch(e){}}();

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
const express_1 = require("express");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// High-level debug utility
function debug(message, ...args) {
    if (process.env.DEBUG !== "true") {
        console.debug(`[DEBUG] ${message}`, ...args);
    }
}
// Cache for loaded routes
const routeCache = new Map();
async function getSubdirectories(baseDir) {
    try {
        const entries = await promises_1.default.readdir(baseDir, { withFileTypes: true });
        const directories = entries
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => path_1.default.resolve(baseDir, dirent.name));
        const subdirPromises = directories.map((dir) => getSubdirectories(dir));
        const subdirectories = await Promise.all(subdirPromises);
        return [...directories, ...subdirectories.flat()];
    }
    catch (error) {
        console.error(`[ERROR] Directory scan failed: ${error}`);
        return [];
    }
}
function validateRouteHandler(handler, file) {
    if (typeof handler !== "function") {
        console.error(`[ERROR] Invalid route handler in ${file}`);
        return false;
    }
    return true;
}
async function loadRouteModule(modulePath, file) {
    if (routeCache.has(modulePath)) {
        debug(`Route module cache hit: ${modulePath}`);
        return routeCache.get(modulePath);
    }
    try {
        const module = await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s)));
        if (module.default && validateRouteHandler(module.default, file)) {
            routeCache.set(modulePath, module);
            debug(`Route module loaded and cached: ${modulePath}`);
            return module;
        }
        throw new Error(`Invalid route module format in ${file}`);
    }
    catch (error) {
        console.trace(`[TRACE] Failed to load route module: ${modulePath}`);
        throw new Error(`Failed to load route module ${file}: ${error}`);
    }
}
const router = (0, express_1.Router)();
exports.router = router;
const routerLoadeds = [];
// Función principal de carga de rutas con mejor manejo de performance
(async () => {
    console.time("RoutesLoadTime");
    const metrics = {
        routesLoaded: 0,
        errors: 0,
    };
    try {
        const routesDirs = await getSubdirectories(path_1.default.resolve(__dirname, "../../interfaces/http/routes"));
        debug(`Starting Express routes loading (${routesDirs.length} directories)`);
        const loadPromises = routesDirs.map(async (routesDir) => {
            const files = (await promises_1.default.readdir(routesDir)).filter((file) => /\.routes\.(ts|js)$/.test(file));
            return Promise.all(files.map(async (file) => {
                const modulePath = path_1.default.join(routesDir, file);
                try {
                    const module = await loadRouteModule(modulePath, file);
                    await module.default({ app: router });
                    metrics.routesLoaded++;
                    routerLoadeds.push({ file, routes: [] });
                    debug(`Route loaded: ${file}`);
                }
                catch (error) {
                    metrics.errors++;
                    console.error(`[ERROR] Route load error: ${error}`, { file, modulePath });
                }
            }));
        });
        await Promise.all(loadPromises);
    }
    catch (error) {
        console.error(`[CRITICAL] Error loading routes: ${error}`);
    }
    finally {
        console.timeEnd("RoutesLoadTime");
        debug([
            `Express Routes Summary:`,
            `  ✅  Loaded: ${metrics.routesLoaded} routes`,
            `  ❌  Errors: ${metrics.errors}`,
            `  📦  Cache size: ${routeCache.size}`,
        ].join("\n"));
    }
})();
//# sourceMappingURL=routes.js.map
//# debugId=4a2b60c3-6a94-5495-a853-3fb51c7607e2
