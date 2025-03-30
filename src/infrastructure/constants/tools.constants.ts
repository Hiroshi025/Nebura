import chalk from "chalk";

export type Labels =
  | "error"
  | "success"
  | "debug"
  | "info"
  | "warn"
  | "cache"
  | "api"
  | "IPBlocker"
  | "LicenseIP"
  | "maintenance";

  /* --- Define colors for log labels --- */
export const labelColors: Record<Labels, chalk.Chalk> = {
  error: chalk.redBright,
  success: chalk.greenBright,
  debug: chalk.magentaBright,
  info: chalk.blueBright,
  maintenance: chalk.hex("#FFA500"),
  warn: chalk.yellowBright,
  cache: chalk.hex("#5c143b"),
  api: chalk.hex("#FFA500"),
  IPBlocker: chalk.hex("#FFA500"),
  LicenseIP: chalk.hex("#FFA500"),
};

/* --- Define labels for log messages --- */
export const labelNames: Record<Labels, string> = {
  error: "Error",
  success: "Success",
  debug: "Debug",
  info: "Info",
  maintenance: "Maintenance",
  warn: "Warn",
  cache: "Cache",
  IPBlocker: "IP Blocker",
  api: "API",
  LicenseIP: "License IP",
};