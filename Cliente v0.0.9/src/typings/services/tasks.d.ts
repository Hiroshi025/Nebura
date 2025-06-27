/**
 * Represents a task entity in the system.
 *
 * @remarks
 * This type defines the structure of a task, including its status, priority, metadata, and optional scheduling or recurrence features.
 *
 * @example
 * ```ts
 * const task: Task = {
 *   id: "1",
 *   title: "Finish documentation",
 *   status: "pending",
 *   priority: "high",
 *   createdBy: "user123",
 *   dueDate: new Date(),
 *   tags: ["docs", "urgent"]
 * };
 * ```
 */
export type Task = {
  /**
   * Unique identifier for the task.
   */
  id: string;
  /**
   * Title or short description of the task.
   */
  title: string;
  /**
   * Detailed description of the task (optional).
   */
  description?: string;
  /**
   * Current status of the task.
   * - "pending": Task is not yet completed.
   * - "completed": Task has been finished.
   * - "canceled": Task was canceled.
   */
  status: "pending" | "completed" | "canceled";
  /**
   * Priority level of the task.
   * - "low": Not urgent.
   * - "medium": Normal priority.
   * - "high": Urgent.
   */
  priority: "low" | "medium" | "high";
  /**
   * Tags or labels associated with the task (optional).
   */
  tags?: string[];
  /**
   * Identifier of the user who created the task.
   */
  createdBy: string;
  /**
   * Due date for the task (optional).
   * Can be a string (ISO date) or Date object.
   */
  dueDate?: string | Date;
  /**
   * Date when the task was created (optional).
   * Can be a string (ISO date) or Date object.
   */
  createdAt?: string | Date;
  /**
   * Date when the task was last updated (optional).
   * Can be a string (ISO date) or Date object.
   */
  updatedAt?: string | Date;
  /**
   * Reminder configuration for the task (optional).
   * @see Reminder
   */
  reminder?: Reminder;
  /**
   * Recurrence configuration for the task (optional).
   * @see Recurrence
   */
  recurrence?: Recurrence;
  /**
   * Date or time when the task should be automatically deleted (optional).
   * Can be a string (ISO date) or Date object.
   */
  autoDelete?: string | Date;
};

/**
 * Structure for creating a new task.
 *
 * @remarks
 * This interface defines the required and optional fields for creating a new task, including scheduling, priority, and reminders.
 *
 * @example
 * ```ts
 * const newTask: CreateTask = {
 *   title: "Write unit tests",
 *   createdBy: "user456",
 *   priority: "medium",
 *   dueDate: "2024-07-01"
 * };
 * ```
 */
export interface CreateTask {
  /**
   * Title or short description of the task.
   */
  title: string;
  /**
   * Detailed description of the task (optional).
   */
  description?: string;
  /**
   * Identifier of the user who is creating the task.
   */
  createdBy: string;
  /**
   * Due date for the task (optional).
   * Can be a string (ISO date) or Date object.
   */
  dueDate: string; // Allow null for optional due date
  /**
   * Initial status of the task (optional).
   * Defaults to "pending" if not specified.
   */
  status?: "pending" | "completed" | "canceled";
  /**
   * Priority level of the task (optional).
   * Defaults to "medium" if not specified.
   */
  priority?: "low" | "medium" | "high";
  /**
   * Tags or labels associated with the task (optional).
   */
  tags?: string[];
  /**
   * Reminder configuration for the task (optional).
   * @see Reminder
   */
  reminder?: Reminder;
  /**
   * Recurrence configuration for the task (optional).
   * @see Recurrence
   */
  recurrence?: Recurrence;
  /**
   * Date or time when the task should be automatically deleted (optional).
   * Can be a string (ISO date) or Date object.
   */
  autoDelete?: string;
}
