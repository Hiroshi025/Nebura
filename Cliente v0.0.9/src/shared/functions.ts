import { timingSafeEqual } from "crypto";
import { Message } from "discord.js";

import emojis from "@config/json/emojis.json";
import { GeminiService } from "@domain/use-cases/services/fetch-google.service";
import { config } from "@utils/config";
import { logWithLabel } from "@utils/functions/console";

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
export async function globalCleanup(taskName: string, cleanupFunction: () => Promise<number>): Promise<void> {
  try {
    const deletedCount = await cleanupFunction();
    logWithLabel(
      "custom",
      [`${taskName} cleanup completed.`, `  ${emojis.database} Deleted items: ${deletedCount}`].join("\n"),
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

/**
 * Calls the Gemini AI service with the provided message content.
 *
 * @param message - The Discord message containing the content to be processed.
 * @returns A Promise that resolves to the response from the Gemini AI service or false if the service is not configured.
 *
 * @example
 * ```typescript
 * const response = await AIGemini(message);
 * if (response) {
 *   console.log("Gemini response:", response);
 * } else {
 *   console.log("Gemini service is not configured.");
 * }
 * ```
 */
export async function AIGemini(message: Message) {
  const { GEMINI_KEY, GEMINI_MODEL, GEMINI_MODEL_INSTRUCTION } = process.env;
  if (!GEMINI_KEY || !GEMINI_MODEL || !GEMINI_MODEL_INSTRUCTION) return false;

  const mention = message.mentions.has(message.client.user!); 
  if (!mention && !message.content.startsWith("!gemini")) return false;
  if (message.content.length < 5) return false;
  if (message.author.bot) return false;

  const content = message.content.replace(/<@!?(\d+)>/g, "").trim();
  const res = await new GeminiService().textGoogle(content, {
    apiKey: GEMINI_KEY,
    model: GEMINI_MODEL,
    systemInstruction: GEMINI_MODEL_INSTRUCTION,
    apiKeyHash: message.author.id,
  });

  if (!res) return false;
  return res;
}
