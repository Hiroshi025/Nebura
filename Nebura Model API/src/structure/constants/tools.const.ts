import chalk from "chalk";

/**
 * Represents the types of labels that can be used for logging purposes.
 * Each label corresponds to a specific category of log messages.
 */
export type Labels =
  | "error"       // Represents an error message.
  | "success"     // Represents a success message.
  | "debug"       // Represents a debug message.
  | "info"        // Represents an informational message.
  | "warn"        // Represents a warning message.
  | "cache"       // Represents a cache-related message.
  | "api"         // Represents an API-related message.
  | "IPBlocker"   // Represents a message related to IP blocking.
  | "LicenseIP"   // Represents a message related to license IP management.
  | "cluster"     // Represents a message related to clustering.
  | "maintenance" // Represents a message related to maintenance operations.

/**
 * A mapping of log labels to their corresponding colors.
 * Each label is associated with a specific color for better visual distinction in logs.
 */
export const labelColors: Record<Labels, chalk.Chalk> = {
  error: chalk.redBright,          // Bright red for error messages.
  success: chalk.greenBright,      // Bright green for success messages.
  debug: chalk.magentaBright,      // Bright magenta for debug messages.
  info: chalk.blueBright,          // Bright blue for informational messages.
  maintenance: chalk.hex("#FFA500"), // Orange for maintenance messages.
  warn: chalk.yellowBright,        // Bright yellow for warning messages.
  cache: chalk.hex("#5c143b"),     // Custom dark purple for cache messages.
  api: chalk.hex("#FFA500"),       // Orange for API-related messages.
  IPBlocker: chalk.hex("#FFA500"), // Orange for IP blocker messages.
  LicenseIP: chalk.hex("#FFA500"), // Orange for license IP messages.
  cluster: chalk.hex("#EB5C2D"),   // Custom orange-red for cluster messages.
};

/**
 * A mapping of log labels to their corresponding display names.
 * These names are used as prefixes in log messages for better readability.
 */
export const labelNames: Record<Labels, string> = {
  error: "Error",           // Display name for error messages.
  success: "Success",       // Display name for success messages.
  debug: "Debug",           // Display name for debug messages.
  info: "Info",             // Display name for informational messages.
  maintenance: "Maintenance", // Display name for maintenance messages.
  warn: "Warn",             // Display name for warning messages.
  cache: "Cache",           // Display name for cache messages.
  IPBlocker: "IP",  // Display name for IP blocker messages.
  api: "API",               // Display name for API-related messages.
  LicenseIP: "License",  // Display name for license IP messages.
  cluster: "Cluster",       // Display name for cluster messages.
};

/**
 * A list of file paths that have been loaded.
 * Each entry in the array represents the path of a loaded file or `undefined` if no file was loaded.
 */
export const filesLoaded: (string | undefined)[] = [];