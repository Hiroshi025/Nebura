import { Task } from "../../../../domain/entities/tasks/task.entity";

/**
 * Data Transfer Object (DTO) for representing a task in HTTP responses.
 *
 * This DTO is used to serialize and transfer task data between the backend and clients.
 * It maps the properties from the {@link Task} entity to a format suitable for API responses.
 *
 * @see {@link Task} for the domain entity definition.
 */
export class TaskResponseDto {
  /**
   * Unique identifier of the task.
   * @example "a1b2c3d4"
   */
  id: string;

  /**
   * Title or name of the task.
   * @example "Finish project documentation"
   */
  title: string;

  /**
   * Detailed description of the task (optional).
   * @example "Complete the documentation for the Nebura API."
   */
  description?: string;

  /**
   * Identifier of the user who created the task.
   * @example "user123"
   */
  createdBy: string;

  /**
   * Date and time when the task was created.
   * @example new Date("2024-06-01T10:00:00Z")
   */
  createdAt: Date;

  /**
   * Due date for the task completion (optional).
   * ISO 8601 string format.
   * @example "2024-06-10T23:59:59Z"
   * @see https://en.wikipedia.org/wiki/ISO_8601
   */
  dueDate?: string;

  /**
   * Current status of the task (e.g., "pending", "completed").
   * @example "pending"
   */
  status: string;

  /**
   * Priority level of the task (e.g., "low", "medium", "high").
   * @example "high"
   */
  priority: string;

  /**
   * List of tags associated with the task.
   * @example ["documentation", "api"]
   */
  tags: string[];

  /**
   * Reminder settings for the task (optional).
   * The structure depends on the application's reminder implementation.
   */
  reminder?: any;

  /**
   * Recurrence settings for the task (optional).
   * The structure depends on the application's recurrence implementation.
   */
  recurrence?: any;

  /**
   * Indicates if the task should be automatically deleted after completion (optional).
   * ISO 8601 string format.
   * @example "2024-06-15T00:00:00Z"
   */
  autoDelete?: string;

  /**
   * Date and time when the task was last updated.
   * @example new Date("2024-06-05T12:00:00Z")
   */
  updatedAt: Date;

  /**
   * Date and time when the task was completed (optional).
   * @example new Date("2024-06-10T18:30:00Z")
   */
  completedAt?: Date;

  /**
   * Constructs a new TaskResponseDto from a Task entity.
   *
   * @param task - The Task entity to map from.
   */
  constructor(task: Task) {
    this.id = task.id;
    this.title = task.title;
    this.description = task.description;
    this.createdBy = task.createdBy;
    this.createdAt = task.createdAt;
    this.dueDate = task.dueDate;
    this.status = task.status;
    this.priority = task.priority;
    this.tags = task.tags;
    this.reminder = task.reminder;
    this.recurrence = task.recurrence;
    this.autoDelete = task.autoDelete;
    this.updatedAt = task.updatedAt;
    this.completedAt = task.completedAt;
  }
}
