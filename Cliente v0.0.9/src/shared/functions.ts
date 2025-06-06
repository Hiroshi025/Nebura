import { timingSafeEqual } from "crypto";
import { Response } from "express";

import { ErrorResponse } from "@/shared/structure/constants/user";
import emojis from "@config/json/emojis.json";
import { config } from "@utils/config";
import { logWithLabel } from "@utils/functions/console";

/**
 * Checks if the provided response is an ErrorResponse object or a string.
 *
 * @param response - The response object to check.
 * @returns True if the response is an ErrorResponse or a string, otherwise false.
 */
export function isErrorResponse(response: any): response is ErrorResponse {
  return (response as ErrorResponse).error !== undefined || typeof response === "string";
}

/**
 * Normalizes various error formats into an array of strings.
 *
 * @param error - The error to normalize. Can be a string, array, or object with an 'errors' property.
 * @returns An array of error messages as strings.
 */
export function normalizeError(error: unknown): string[] {
  if (typeof error === "string") return [error];

  if (Array.isArray(error)) {
    return error.map((e) => (typeof e === "string" ? e : e.message));
  }

  if (typeof error === "object" && error !== null && "errors" in error) {
    const errObj = error as { errors: unknown };
    if (typeof errObj.errors === "string") return [errObj.errors];
    if (Array.isArray(errObj.errors)) {
      return errObj.errors.map((e) => (typeof e === "string" ? e : e.message));
    }
  }

  return ["Unknown error occurred"];
}

/**
 * Sends a standardized error response using Express.
 *
 * @param res - The Express Response object.
 * @param status - The HTTP status code to send.
 * @param errors - An array of error messages to include in the response.
 * @returns The Express response with error information.
 */
export function sendErrorResponse(res: Response, status: number, errors: string[]) {
  return res.status(status).json({
    errors,
    data: null,
  });
}

/**
 * Sends a standardized success response using Express.
 *
 * @typeParam T - The type of the data to send in the response.
 * @param res - The Express Response object.
 * @param status - The HTTP status code to send.
 * @param data - The data to include in the response.
 * @returns The Express response with data and no errors.
 */
export function sendSuccessResponse<T>(res: Response, status: number, data: T) {
  return res.status(status).json({
    data,
    errors: [],
  });
}

/**
 * Compares two strings in a timing-safe manner to prevent timing attacks.
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns True if the strings are equal, false otherwise.
 */
export function safeCompare(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Constructs the base URL for the API host, including protocol and port if necessary.
 *
 * @returns The constructed host URL as a string.
 */
export function hostURL(): string {
  const host =
    config.environments.default.api.host === "localhost"
      ? "http://localhost"
      : `https://${config.environments.default.api.host}`;
  const port = config.environments.default.api.port;

  if (config.environments.default.api.host === "localhost") {
    return `${host}:${port}`;
  }
  return `${host}`;
}

/**
 * Executes a cleanup task and logs the result.
 *
 * @param taskName - The name of the cleanup task.
 * @param cleanupFunction - An asynchronous function that performs the cleanup and returns the number of deleted items.
 * @returns A Promise that resolves when the cleanup and logging are complete.
 */
export async function globalCleanup(
  taskName: string,
  cleanupFunction: () => Promise<number>,
): Promise<void> {
  try {
    const deletedCount = await cleanupFunction();
    logWithLabel(
      "custom",
      [
        `${taskName} cleanup completed.`,
        `  ${emojis.database} Deleted items: ${deletedCount}`,
      ].join("\n"),
      {
        customLabel: "Tasks",
      },
    );
  } catch (error) {
    logWithLabel("error", `${error}`);
    console.error(error);
  }
}

//const taskService = new TaskService();

// Run the cleanup task for global tasks.
//executeGlobalCleanup("Global Tasks", () => taskService.cleanUpTasks());
