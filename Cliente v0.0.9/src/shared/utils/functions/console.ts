import chalk from "chalk";
import os from "os";
import path from "path";

import { labelColors, labelNames, Labels } from "@/shared/structure/constants/tools";
import Sentry from "@sentry/node";
import { LogContext } from "@typings/utils";
import { WinstonLogger } from "@utils/winston";

import { config } from "../config";

const logger = new WinstonLogger();
type LogLevel = Labels | "debug" | "verbose" | "warning";

// Constants for consistent formatting
const LABEL_WIDTH = 12;
const ORIGIN_WIDTH = 20;
const TIME_WIDTH = 24;

/**
 * Logs a message with a specific label and additional context or error information.
 *
 * This function formats the log output with consistent widths for labels, origins, and timestamps.
 * It also integrates with Winston for structured logging and Sentry for error tracking.
 *
 * @param level - The log level or label. Can be a predefined label, "debug", "verbose", "warning", or "custom".
 * @param message - The main log message to display.
 * @param options - Optional parameters for additional context or error information.
 * @param options.customLabel - A custom label to use when the level is "custom".
 * @param options.context - Additional context data to include in the log. Only displayed in development mode.
 * @param options.error - An error object to include in the log. Its stack trace will be displayed if available.
 *
 * @throws {Error} If the level is "custom" and no custom label is provided.
 */
export async function logWithLabel(
  level: LogLevel | "custom",
  message: string,
  options?: {
    customLabel?: string;
    context?: LogContext;
    error?: Error;
  },
) {
  // Validación de parámetros
  if (level === "custom" && !options?.customLabel) {
    throw new Error("Custom label name must be provided when using custom level.");
  }

  // Configuración de etiquetas
  const labelName = level === "custom" ? options!.customLabel! : labelNames[level as Labels];
  const labelColor = level === "custom" ? chalk.hex("#5c143b") : labelColors[level as Labels];

  // Obtener información del sistema
  const hostname = os.hostname();
  const pid = process.pid;
  const appVersion = config.project.version;

  // Obtener origen del log
  const origin = getLogOrigin();
  const time = new Date().toISOString();

  // Format components with consistent widths
  const formattedLabel = labelColor(labelName.padEnd(LABEL_WIDTH, " "));
  const formattedAppInfo = chalk.hex("#ffffbf")(
    `${config.project.name}@${appVersion}`.padEnd(20, " "),
  );
  const formattedHost = chalk.grey(`[${hostname}:${pid}]`.padEnd(15, " "));

  // Truncate or pad the origin for consistent width
  let formattedOrigin = origin;
  if (origin.length > ORIGIN_WIDTH) {
    const ext = path.extname(origin);
    const basename = path.basename(origin, ext);
    const truncatedBasename = basename.substring(0, ORIGIN_WIDTH - ext.length - 3) + "...";
    formattedOrigin = chalk.grey(`${truncatedBasename}${ext}`.padEnd(ORIGIN_WIDTH, " "));
  } else {
    formattedOrigin = chalk.grey(origin.padEnd(ORIGIN_WIDTH, " "));
  }

  const formattedTime = chalk.hex("#386ce9")(`[${time}]`.padEnd(TIME_WIDTH, " "));

  // Build the main log line
  const mainLineParts = [
    `${formattedLabel}→`, // Arrow after label
    formattedAppInfo,
    formattedHost,
    formattedOrigin,
    `${formattedTime}\n`,
    message,
  ];

  console.log(mainLineParts.join(" "));

  /**
   * Logs additional context data if provided and the environment is set to "development".
   * The context is formatted as a JSON string and indented for readability.
   */
  if (process.env.NODE_ENV === "development" && options?.context) {
    const contextStr = JSON.stringify(options.context, null, 2)
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    console.log(chalk.hex("#2aa198")(`  Context:\n${contextStr}`));
  }

  /**
   * Logs the stack trace of an error if provided. The stack trace is indented for readability.
   * If no stack trace is available, a default message is displayed.
   */
  if (options?.error) {
    const errorStack =
      options.error.stack
        ?.split("\n")
        .map((line) => `  ${line}`)
        .join("\n") || "No stack available";
    console.log(chalk.red(`  Error Stack:\n${errorStack}`));
  }

  // Winston logging
  logger.info(
    JSON.stringify({
      message,
      level: level === "custom" ? "info" : level,
      origin,
      timestamp: time,
      hostname,
      pid,
      version: appVersion,
      ...options?.context,
      ...(options?.error && { stack: options.error.stack }),
    }),
  );

  // Sentry integration for errors
  if (level === "error") {
    Sentry.withScope((scope) => {
      if (options?.context) {
        scope.setExtras(options.context);
      }
      if (options?.error) {
        scope.setExtra("stack", options.error.stack);
      }
      Sentry.captureException(options?.error || new Error(message));
    });
  }
}

/**
 * Retrieves the origin file path of the log call.
 *
 * This function analyzes the stack trace to determine the file and line number where the log function was called.
 * It skips frames related to the logger itself and attempts to return a relative path from the project root.
 *
 * @returns {string} The relative file path of the log origin, or "unknown" if it cannot be determined.
 */
const getLogOrigin = (): string => {
  try {
    const originalPrepare = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;

    const err = new Error();
    const stack = err.stack as unknown as NodeJS.CallSite[];
    Error.prepareStackTrace = originalPrepare;

    if (!Array.isArray(stack)) return "unknown";

    // Skip frames from this file and logger-related files
    const currentFile = __filename;
    const loggerFiles = ["logger", "log", "winston"]; // Add other logger-related keywords if needed

    for (const frame of stack.slice(1)) {
      const fileName = frame.getFileName();
      if (!fileName) continue;

      const isLoggerFile = loggerFiles.some((keyword) => fileName.toLowerCase().includes(keyword));

      if (fileName !== currentFile && !isLoggerFile) {
        // Return relative path from project root if possible
        const projectRoot = path.join(__dirname, "../../");
        const relativePath = path.relative(projectRoot, fileName);
        return relativePath || path.basename(fileName);
      }
    }

    return "unknown";
  } catch {
    return "unknown";
  }
};
