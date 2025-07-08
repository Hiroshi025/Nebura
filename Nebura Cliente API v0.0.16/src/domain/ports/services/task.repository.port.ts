import { Task } from "@domain/entities/tasks/task.entity";
import { TaskQueryFilters } from "@typings/modules/api";
import { CreateTask } from "@typings/services/tasks";

/**
 * Interface for the Task Repository Port.
 *
 * @remarks
 * This interface defines the contract for task-related persistence operations,
 * including creation, retrieval, updating, and deletion of tasks.
 * Implementations should handle the data access logic for task entities.
 *
 * @see {@link https://en.wikipedia.org/wiki/CRUD CRUD - Wikipedia}
 */
export interface ITaskPort {
  /**
   * Creates a new task.
   *
   * @param data - The data required to create a new task.
   * @returns A promise that resolves to the created {@link Task} entity.
   *
   * @example
   * ```ts
   * const task = await taskRepository.create({ title: "New Task", ... });
   * ```
   */
  create(data: CreateTask): Promise<Task>;

  /**
   * Finds a task by its unique identifier.
   *
   * @param id - The unique identifier of the task.
   * @returns A promise that resolves to the {@link Task} entity if found, or `null` if not found.
   *
   * @example
   * ```ts
   * const task = await taskRepository.findById("taskId123");
   * ```
   */
  findById(id: string): Promise<Task | null>;

  /**
   * Finds multiple tasks matching the provided filters.
   *
   * @param filters - Optional filters to apply to the task query.
   * @returns A promise that resolves to an array of {@link Task} entities.
   *
   * @example
   * ```ts
   * const tasks = await taskRepository.findMany({ status: "pending" });
   * ```
   */
  findMany(filters?: TaskQueryFilters): Promise<Task[]>;

  /**
   * Updates an existing task by its unique identifier.
   *
   * @param id - The unique identifier of the task to update.
   * @param data - Partial data to update the task.
   * @returns A promise that resolves to the updated {@link Task} entity.
   *
   * @example
   * ```ts
   * const updatedTask = await taskRepository.update("taskId123", { title: "Updated Title" });
   * ```
   */
  update(id: string, data: Partial<CreateTask>): Promise<Task>;

  /**
   * Deletes a task by its unique identifier.
   *
   * @param id - The unique identifier of the task to delete.
   * @returns A promise that resolves when the task is deleted.
   *
   * @example
   * ```ts
   * await taskRepository.delete("taskId123");
   * ```
   */
  delete(id: string): Promise<void>;

  /**
   * Deletes all tasks that are set to auto-delete before a specific date.
   *
   * @param date - The cutoff date; tasks with auto-delete dates before this will be deleted.
   * @returns A promise that resolves to the number of tasks deleted.
   *
   * @example
   * ```ts
   * const deletedCount = await taskRepository.deleteManyAutoDeleteBefore(new Date());
   * ```
   */
  deleteManyAutoDeleteBefore(date: Date): Promise<number>;
}
