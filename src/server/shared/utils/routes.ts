import chalk from "chalk";
import { Router } from "express";
import fs from "fs";
import path from "path";

import { logWithLabel } from "@/shared/utils/functions/console";

/**
 * Array of directories containing route files.
 */
const routesDirs = [
  path.resolve(__dirname, "../../interfaces/http/routes/api/license"),
  path.resolve(__dirname, "../../interfaces/http/routes/api/blocker"),
  path.resolve(__dirname, "../../interfaces/http/routes/api/auth"),
];

/**
 * Array to keep track of successfully loaded route files and their respective routes.
 */
const routerLoadeds: { file: string; routes: { method: string; path: string }[] }[] = [];

/**
 * Express Router instance that will be populated with the loaded routes.
 */
const router = Router();

/**
 * Asynchronously loads all route files from the specified directories.
 */
(async () => {
  const start = performance.now();

  // Procesar cada directorio de rutas
  for (const routesDir of routesDirs) {
    const files = fs
      .readdirSync(routesDir)
      .filter((file) => file.endsWith(".routes.ts") || file.endsWith(".routes.js"));

    // Cargar las rutas de forma asincrónica
    const imports = files.map(async (file) => {
      const modulePath = path.join(routesDir, file);

      try {
        const module = await import(modulePath);
        if (module.default) {
          const routesHandler = module.default;
          routesHandler({ app: router });
          routerLoadeds.push({ file, routes: [] }); // Registrar la ruta cargada
        } else {
          logWithLabel("custom", `No default export found in ${modulePath}`, "Express");
        }
      } catch (err) {
        logWithLabel("custom", `Error while importing ${modulePath}: ${err}`, "Express");
      }
    });

    // Esperar a que todas las rutas del directorio se importen
    await Promise.all(imports);
  }

  const end = performance.now();
  logWithLabel(
    "custom",
    [
      `Loading Routes-Endpoints Express`,
      chalk.grey(`  ✅  Finished Loading Routes-Endpoints Express`),
      chalk.grey(`  🟢  Routes-Endpoints Loaded Successfully: ${routerLoadeds.length}`),
      chalk.grey(`  🕛  Took: ${((end - start) / 1000).toFixed(2)}s`),
    ].join("\n"),
    "Express",
  );
})();

export { router };
