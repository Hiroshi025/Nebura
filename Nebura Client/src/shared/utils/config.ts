import fs from "fs";
import path from "path";
import YAML from "yaml";

import { ProyectConfig } from "@typings/config";

import { logWithLabel } from "./functions/console";

/**
 * Reads a YAML configuration file and returns its parsed contents.
 * @param {string} filename - The name of the configuration file to read.
 * @returns The parsed contents of the configuration file as type `T`.
 */
const configDir = path.resolve(__dirname, "..", "..", "..", "config");
function readConfigFile<T>(filename: string): T {
  const filePath = path.join(configDir, filename);

  if (!fs.existsSync(filePath)) {
    logWithLabel("error", `Configuration file ${filename} not found.`);
    process.exit(1);
  }

  if (!fs.statSync(filePath).isFile()) {
    logWithLabel("error", `${filename} is not a file.`);
    process.exit(1);
  }

  if (path.extname(filePath) !== ".yml" && path.extname(filePath) !== ".yaml") {
    logWithLabel("error", `${filename} is not a YAML file.`);
    process.exit(1);
  }


  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    return YAML.parse(fileContents) as T;
  } catch (error) {
    logWithLabel("error", `Error reading ${filename}: ${error}`);
    process.exit(1);
  }
}

const config = readConfigFile<ProyectConfig>("config.yml");
export { config, readConfigFile };
