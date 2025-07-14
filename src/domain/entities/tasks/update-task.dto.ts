import { Recurrence, Reminder } from "./task.entity";

/**
 * Data Transfer Object for updating a task.
 *
 * All properties are optional and can be used to partially update a task entity.
 *
 * @property title - The title of the task
 * @property description - The description of the task
 * @property dueDate - The due date for the task
 * @property status - The status of the task ('pending', 'completed', or 'canceled')
 * @property priority - The priority level of the task ('low', 'medium', or 'high')
 * @property tags - An array of tags associated with the task
 * @property reminder - Reminder configuration for the task (see {@link Reminder})
 * @property recurrence - Recurrence configuration for the task (see {@link Recurrence})
 * @property autoDelete - Date when the task should be automatically deleted
 *
 * @see {@link Recurrence}
 * @see {@link Reminder}
 */
export class UpdateTaskDto {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: "pending" | "completed" | "canceled";
  priority?: "low" | "medium" | "high";
  tags?: string[];
  reminder?: Reminder | null;
  recurrence?: Recurrence | null;
  autoDelete?: Date | null;
}
