import { Recurrence, Reminder } from "@domain/entities/tasks/task.entity";

/**
 * Data Transfer Object (DTO) for creating a new task.
 *
 * This DTO defines the structure of the data required to create a new task via the API.
 * It is used for validating and transferring task creation data from the client to the backend.
 *
 * @see {@link Recurrence}
 * @see {@link Reminder}
 */
export class CreateTaskDto {
  /**
   * Title or name of the task.
   * @example "Write API documentation"
   */
  title: string = "";

  /**
   * Detailed description of the task (optional).
   * @example "Document all endpoints for the Nebura Client API."
   */
  description?: string;

  /**
   * Identifier of the user who creates the task.
   * @example "user123"
   */
  createdBy: string = "";

  /**
   * Due date for the task completion (optional).
   * ISO 8601 string format.
   * @example "2024-06-10T23:59:59Z"
   * @see https://en.wikipedia.org/wiki/ISO_8601
   */
  dueDate?: string;

  /**
   * Status of the task (optional).
   * Allowed values: "pending", "completed", "canceled".
   * @example "pending"
   */
  status?: "pending" | "completed" | "canceled";

  /**
   * Priority level of the task (optional).
   * Allowed values: "low", "medium", "high".
   * @example "high"
   */
  priority?: "low" | "medium" | "high";

  /**
   * List of tags associated with the task (optional).
   * @example ["api", "documentation"]
   */
  tags?: string[];

  /**
   * Reminder settings for the task (optional).
   * The structure is defined by the {@link Reminder} type.
   */
  reminder?: Reminder;

  /**
   * Recurrence settings for the task (optional).
   * The structure is defined by the {@link Recurrence} type.
   */
  recurrence?: Recurrence;

  /**
   * Indicates if the task should be automatically deleted after a certain date (optional).
   * ISO 8601 string format.
   * @example "2024-06-15T00:00:00Z"
   */
  autoDelete?: string;
}
