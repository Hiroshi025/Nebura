import { Router } from "express";
import fs from "fs/promises";
import path from "path";

// High-level debug utility
function debug(message: string, ...args: any[]) {
  if (process.env.DEBUG !== "true") {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

// Cache for loaded routes
const routeCache = new Map();

async function getSubdirectories(baseDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const directories = entries
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.resolve(baseDir, dirent.name));

    const subdirPromises = directories.map((dir) => getSubdirectories(dir));
    const subdirectories = await Promise.all(subdirPromises);

    return [...directories, ...subdirectories.flat()];
  } catch (error) {
    console.error(`[ERROR] Directory scan failed: ${error}`);
    return [];
  }
}

function validateRouteHandler(handler: any, file: string): boolean {
  if (typeof handler !== "function") {
    console.error(`[ERROR] Invalid route handler in ${file}`);
    return false;
  }
  return true;
}

async function loadRouteModule(modulePath: string, file: string) {
  if (routeCache.has(modulePath)) {
    debug(`Route module cache hit: ${modulePath}`);
    return routeCache.get(modulePath);
  }

  try {
    const module = await import(modulePath);
    if (module.default && validateRouteHandler(module.default, file)) {
      routeCache.set(modulePath, module);
      debug(`Route module loaded and cached: ${modulePath}`);
      return module;
    }
    throw new Error(`Invalid route module format in ${file}`);
  } catch (error) {
    console.trace(`[TRACE] Failed to load route module: ${modulePath}`);
    throw new Error(`Failed to load route module ${file}: ${error}`);
  }
}

const router = Router();
const routerLoadeds: { file: string; routes: { method: string; path: string }[] }[] = [];

// Función principal de carga de rutas con mejor manejo de performance
(async () => {
  console.time("RoutesLoadTime");
  const metrics = {
    routesLoaded: 0,
    errors: 0,
  };

  try {
    const routesDirs = await getSubdirectories(
      path.resolve(__dirname, "../../interfaces/http/routes"),
    );

    debug(`Starting Express routes loading (${routesDirs.length} directories)`);

    const loadPromises = routesDirs.map(async (routesDir) => {
      const files = (await fs.readdir(routesDir)).filter((file) => /\.routes\.(ts|js)$/.test(file));

      return Promise.all(
        files.map(async (file) => {
          const modulePath = path.join(routesDir, file);

          try {
            const module = await loadRouteModule(modulePath, file);
            await module.default({ app: router });
            metrics.routesLoaded++;
            routerLoadeds.push({ file, routes: [] });
            debug(`Route loaded: ${file}`);
          } catch (error) {
            metrics.errors++;
            console.error(`[ERROR] Route load error: ${error}`, { file, modulePath });
          }
        }),
      );
    });

    await Promise.all(loadPromises);
  } catch (error) {
    console.error(`[CRITICAL] Error loading routes: ${error}`);
  } finally {
    console.timeEnd("RoutesLoadTime");
    debug(
      [
        `Express Routes Summary:`,
        `  ✅  Loaded: ${metrics.routesLoaded} routes`,
        `  ❌  Errors: ${metrics.errors}`,
        `  📦  Cache size: ${routeCache.size}`,
      ].join("\n"),
    );
  }
})();

export { router };
