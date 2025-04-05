import emojis from "@config/json/emojis.json";

import { logWithLabel } from "./functions/console";

//const taskService = new TaskService();

/**
 * Executes a cleanup task and handles logging and errors.
 * @param taskName The name of the task being executed.
 * @param cleanupFunction The cleanup function to execute.
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
      "Tasks",
    );
  } catch (error) {
    logWithLabel("error", `${error}`);
    console.error(error);
  } 
}

// Run the cleanup task for global tasks.
//executeGlobalCleanup("Global Tasks", () => taskService.cleanUpTasks());
