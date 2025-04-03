import chalk from "chalk";
import { Router } from "express";
import fs from "fs";
import path from "path";

import { logWithLabel } from "@/shared/utils/functions/console";

/**
 * Recursively retrieves all subdirectories inside the specified base directory.
 *
 * @param baseDir - The base directory to scan for subdirectories.
 * @returns An array of absolute paths to the subdirectories.
 */
function getSubdirectories(baseDir: string): string[] {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true }); // Read directory contents with file type information.
  const directories = entries
    .filter((dirent) => dirent.isDirectory()) // Filter only directories.
    .map((dirent) => path.resolve(baseDir, dirent.name)); // Resolve full paths of the directories.

  // Recursively get subdirectories for each directory.
  const subdirectories = directories.flatMap((dir) => getSubdirectories(dir));

  return [...directories, ...subdirectories]; // Combine current directories with their subdirectories.
}

/**
 * Array of directories containing route files.
 * Automatically includes all subdirectories inside the `routes` directory.
 */
const routesDirs = getSubdirectories(path.resolve(__dirname, "../../interfaces/http/routes"));

/**
 * Array to keep track of successfully loaded route files and their respective routes.
 * Each entry contains the file name and an array of route objects with method and path.
 */
const routerLoadeds: { file: string; routes: { method: string; path: string }[] }[] = [];

/**
 * Express Router instance that will be populated with the loaded routes.
 * This router will be used to register all the routes dynamically.
 */
const router = Router();

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

  logWithLabel(
    "custom",
    [
      `Loading Routes-Endpoints Express`,
      chalk.grey(`  🟡  Loading Routes-Endpoints Express...`),
      chalk.grey(`  📂  Directories Found: ${routesDirs.length}`),
    ].join("\n"),
    "Express",
  );

  // Process each directory containing route files.
  for (const routesDir of routesDirs) {
    const files = fs
      .readdirSync(routesDir) // Read all files in the directory.
      .filter((file) => file.endsWith(".routes.ts") || file.endsWith(".routes.js")); // Filter route files.

    // Load the routes asynchronously.
    const imports = files.map(async (file) => {
      const modulePath = path.join(routesDir, file); // Construct the full path to the module.

      try {
        const module = await import(modulePath); // Dynamically import the module.
        if (module.default) {
          const routesHandler = module.default; // Get the default export (route handler).
          routesHandler({ app: router }); // Register the routes to the Express router.
          routerLoadeds.push({ file, routes: [] }); // Track the loaded route file.
        } else {
          logWithLabel("custom", `No default export found in ${modulePath}`, "Express"); // Log missing default export.
        }
      } catch (err) {
        logWithLabel("custom", `Error while importing ${modulePath}: ${err}`, "Express"); // Log errors during import.
      }
    });

    // Wait for all route files in the directory to be imported.
    await Promise.all(imports);
  }

  const end = performance.now(); // End measuring the time taken to load routes.

  // Log the summary of the route loading process.
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

/**
 * Export the Express router instance.
 * This router contains all the dynamically loaded routes and can be used in the main application.
 */
export { router };
