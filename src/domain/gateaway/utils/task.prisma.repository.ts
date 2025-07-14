import { main } from "@/main";
import { Recurrence, Reminder, Task } from "@domain/entities/tasks/task.entity";
import { ITaskPort } from "@domain/ports/services/task.repository.port";
import { TaskQueryFilters } from "@typings/modules/api";
import { CreateTask } from "@typings/services/tasks";

/**
 * TaskRepository provides CRUD operations for tasks using Prisma ORM.
 *
 * Implements {@link ITaskPort}.
 * Handles serialization/deserialization of recurrence and reminder fields.
 *
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client Prisma Client}
 */
export class TaskRepository implements ITaskPort {
  /**
   * Creates a new task in the database.
   * @param data - Task creation data (see {@link CreateTask})
   * @returns The created Task entity with parsed recurrence and reminder fields.
   */
  async create(data: CreateTask) {
    const task = await main.prisma.task.create({ data });
    return {
      ...task,
      recurrence: task.recurrence ? (JSON.parse(task.recurrence as string) as Recurrence) : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    } as Task;
  }

  /**
   * Finds a task by its unique ID.
   * @param id - The task's unique identifier.
   * @returns The Task entity if found, or null if not found.
   */
  async findById(id: string): Promise<Task | null> {
    const task = await main.prisma.task.findUnique({ where: { id } });
    if (!task) return null;
    return {
      ...task,
      recurrence: task.recurrence ? (JSON.parse(task.recurrence as string) as Recurrence) : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    } as Task;
  }

  /**
   * Finds multiple tasks matching the provided filters.
   * @param filters - Optional filters for status, priority, createdBy, or tag (see {@link TaskQueryFilters})
   * @returns An array of Task entities.
   */
  async findMany(filters: TaskQueryFilters = {}): Promise<Task[]> {
    const { status, priority, createdBy, tag } = filters;
    const tasks = await main.prisma.task.findMany({
      where: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(createdBy && { createdBy }),
        ...(tag && { tags: { has: tag } }),
      },
    });
    return tasks.map((task) => ({
      ...task,
      recurrence: task.recurrence ? (JSON.parse(task.recurrence as string) as Recurrence) : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    })) as Task[];
  }

  /**
   * Updates a task by its ID.
   * @param id - The task's unique identifier.
   * @param data - Partial update data for the task.
   * @returns The updated Task entity with parsed recurrence and reminder fields.
   */
  async update(id: string, data: Partial<CreateTask>) {
    const task = await main.prisma.task.update({ where: { id }, data });
    return {
      ...task,
      recurrence: task.recurrence ? (JSON.parse(task.recurrence as string) as Recurrence) : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    } as Task;
  }

  /**
   * Deletes a task by its ID.
   * @param id - The task's unique identifier.
   * @returns void
   */
  async delete(id: string): Promise<void> {
    await main.prisma.task.delete({ where: { id } });
  }

  /**
   * Deletes all tasks with autoDelete date before or equal to the specified date.
   * @param date - The cutoff date for auto-deletion.
   * @returns The number of deleted tasks.
   */
  async deleteManyAutoDeleteBefore(date: Date): Promise<number> {
    const result = await main.prisma.task.deleteMany({
      where: { autoDelete: { lte: date.toISOString() } },
    });
    return result.count;
  }
}
