/**
 * Represents a task entity in the system.
 *
 * @property id - Unique identifier for the task
 * @property title - Title of the task
 * @property description - Optional description of the task
 * @property createdBy - User ID of the creator
 * @property createdAt - Date when the task was created
 * @property dueDate - Optional due date for the task (ISO string)
 * @property status - Current status of the task ('pending', 'completed', or 'canceled')
 * @property priority - Priority level of the task ('low', 'medium', or 'high')
 * @property tags - Array of tags associated with the task
 * @property reminder - Optional reminder configuration (see {@link Reminder})
 * @property recurrence - Optional recurrence configuration (see {@link Recurrence})
 * @property autoDelete - Optional date when the task should be auto-deleted (ISO string)
 * @property updatedAt - Date when the task was last updated
 * @property completedAt - Optional date when the task was completed
 *
 * @see {@link Reminder}
 * @see {@link Recurrence}
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  dueDate?: string;
  status: "pending" | "completed" | "canceled";
  priority: "low" | "medium" | "high";
  tags: string[];
  reminder?: Reminder;
  recurrence?: Recurrence;
  autoDelete?: string;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Represents a reminder configuration for a task.
 *
 * @property enabled - Whether the reminder is enabled
 * @property timeBefore - Time before the due date to trigger the reminder (e.g., "30 minutes")
 * @property notified - Optional flag indicating if the user has been notified
 */
export interface Reminder {
  enabled: boolean;
  timeBefore: string; // e.g. "30 minutes"
  notified?: boolean;
}

/**
 * Represents a recurrence configuration for a task.
 *
 * @property type - Type of recurrence ('daily', 'weekly', 'monthly', or 'yearly')
 * @property interval - Optional interval for the recurrence (e.g., every 2 weeks)
 * @property endDate - Optional end date for the recurrence
 * @property times - Optional number of times the recurrence should happen
 */
export interface Recurrence {
  type: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  endDate?: Date;
  times?: number;
}
