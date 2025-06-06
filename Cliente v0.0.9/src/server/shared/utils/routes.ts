import chalk from "chalk";
import { Router } from "express";
import fs from "fs/promises";
import path from "path";

import { logWithLabel } from "@/shared/utils/functions/console";

// Cache para rutas ya cargadas
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
    logWithLabel("error", `Error scanning directories: ${error}`);
    return [];
  }
}

// Validador de rutas
function validateRouteHandler(handler: any, file: string): boolean {
  if (typeof handler !== "function") {
    logWithLabel("error", `Invalid route handler in ${file}`);
    return false;
  }
  return true;
}

async function loadRouteModule(modulePath: string, file: string) {
  if (routeCache.has(modulePath)) {
    return routeCache.get(modulePath);
  }

  try {
    const module = await import(modulePath);
    if (module.default && validateRouteHandler(module.default, file)) {
      routeCache.set(modulePath, module);
      return module;
    }
    throw new Error(`Invalid route module format in ${file}`);
  } catch (error) {
    throw new Error(`Failed to load route module ${file}: ${error}`);
  }
}

const router = Router();
const routerLoadeds: { file: string; routes: { method: string; path: string }[] }[] = [];

// Función principal de carga de rutas con mejor manejo de performance
(async () => {
  const metrics = {
    startTime: performance.now(),
    routesLoaded: 0,
    errors: 0,
  };

  try {
    const routesDirs = await getSubdirectories(
      path.resolve(__dirname, "../../interfaces/http/routes"),
    );

    logWithLabel(
      "custom",
      `Starting Routes-Endpoints Express Load (${routesDirs.length} directories)`,
      { customLabel: "Express" },
    );

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
          } catch (error) {
            metrics.errors++;
            logWithLabel("error", `Route load error: ${error}`, {
              context: { file, modulePath },
            });
          }
        }),
      );
    });

    await Promise.all(loadPromises);
  } catch (error) {
    logWithLabel("error", `Critical error loading routes: ${error}`);
  } finally {
    const loadTime = (performance.now() - metrics.startTime) / 1000;

    logWithLabel(
      "custom",
      [
        `Routes-Endpoints Express Summary:`,
        chalk.grey(`  ✅  Loaded: ${metrics.routesLoaded} routes`),
        chalk.grey(`  ❌  Errors: ${metrics.errors}`),
        chalk.grey(`  ⏱️   Load time: ${loadTime.toFixed(2)}s`),
        chalk.grey(`  📦  Cache size: ${routeCache.size}`),
      ].join("\n"),
      { customLabel: "Express" },
    );
  }
})();

export { router };
