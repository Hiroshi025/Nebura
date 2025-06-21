import { TaskRecurrence, TaskReminder } from "@/adapters/validators/task";
import { CreateTaskDto } from "@/application/entities/tasks/create-task.dto";
import { Recurrence, Reminder, Task } from "@/application/entities/tasks/task.entity";
import { UpdateTaskDto } from "@/application/entities/tasks/update-task.dto";
import { Notification } from "@/interfaces/messaging/broker/notification"; // Importa Notification
import { main } from "@/main";
import { CreateTask } from "@typings/server/tasks";

/**
 * Service for managing tasks, including creation, retrieval, updating, deletion, and cleanup.
 *
 * Uses Prisma ORM for database operations.
 *
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client Prisma Client}
 */
export class TaskService {
  private notifier = new Notification(); // Instancia de Notification
  /**
   * Creates a new task in the database.
   *
   * Serializes recurrence and reminder fields as JSON strings for storage.
   * Normalizes date fields to ISO-8601 format.
   *
   * @param {CreateTaskDto} createTaskDto - Data Transfer Object containing task creation data.
   * @returns {Promise<Task>} The created task entity.
   */
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    // Validar recurrence si existe
    let valid: ReturnType<typeof TaskRecurrence.safeParse> | undefined;
    if (createTaskDto.recurrence) {
      valid = TaskRecurrence.safeParse(createTaskDto.recurrence);
      if (!valid.success) throw new Error("Invalid recurrence format");
      // Puedes usar valid.data si necesitas el valor parseado
    }
    // Validar reminder si existe
    let validReminder: ReturnType<typeof TaskReminder.safeParse> | undefined;
    if (createTaskDto.reminder) {
      validReminder = TaskReminder.safeParse(createTaskDto.reminder);
      if (!validReminder.success) throw new Error("Invalid reminder format");
      // Puedes usar validReminder.data si necesitas el valor parseado
    }

    const recurrence: Recurrence | undefined = valid?.data;
    const reminder: Reminder | undefined = validReminder?.data;
    const data: CreateTask = {
      ...createTaskDto,
      createdBy: createTaskDto.createdBy,
      recurrence,
      status: createTaskDto.status || "pending",
      priority: createTaskDto.priority || "medium",
      tags: createTaskDto.tags || [],
      reminder,
    };

    if (data.dueDate) {
      data.dueDate =
        typeof data.dueDate === "string"
          ? new Date(data.dueDate)
          : data.dueDate instanceof Date
            ? data.dueDate
            : undefined;
    }
    if (data.autoDelete) {
      data.autoDelete =
        typeof data.autoDelete === "string"
          ? new Date(data.autoDelete)
          : data.autoDelete instanceof Date
            ? data.autoDelete
            : undefined;
    }

    const task = await main.prisma.task.create({ data });
    // Notificación detallada en inglés
    await this.notifier.sendWebhookNotification(
      "Task Created",
      `A new task has been created by user ID: \`${createTaskDto.createdBy}\`.`,
      "#4CAF50",
      [
        { name: "Title", value: createTaskDto.title || "No title", inline: true },
        {
          name: "Due Date",
          value: data.dueDate
            ? data.dueDate instanceof Date
              ? data.dueDate.toISOString()
              : data.dueDate
            : "Not set",
          inline: true,
        },
        { name: "Priority", value: createTaskDto.priority || "medium", inline: true },
        {
          name: "Tags",
          value:
            createTaskDto.tags && createTaskDto.tags.length > 0
              ? createTaskDto.tags.join(", ")
              : "None",
          inline: false,
        },
      ],
      { content: "🟢 Task creation event", username: "Task Service" },
    );
    return {
      ...task,
      recurrence: task.recurrence
        ? (JSON.parse(task.recurrence as string) as Recurrence)
        : undefined,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
    } as Task;
  }

  /**
   * Retrieves a task by its unique identifier.
   *
   * @param {string} id - The unique identifier of the task.
   * @returns {Promise<Task | null>} The task entity if found, otherwise null.
   */
  async getById(id: string): Promise<Task | null> {
    const task = await main.prisma.task.findUnique({
      where: { id },
    });
    return task as Task | null;
  }

  /**
   * Retrieves all tasks, optionally filtered by status, priority, creator, or tag.
   *
   * @param {Object} filters - Optional filters for querying tasks.
   * @param {string} [filters.status] - Filter by task status.
   * @param {string} [filters.priority] - Filter by task priority.
   * @param {string} [filters.createdBy] - Filter by creator's user ID.
   * @param {string} [filters.tag] - Filter by tag.
   * @returns {Promise<Task[]>} Array of task entities.
   */
  async get(
    filters: {
      status?: string;
      priority?: string;
      createdBy?: string;
      tag?: string;
    } = {},
  ): Promise<Task[]> {
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
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
      recurrence: task.recurrence
        ? (JSON.parse(task.recurrence as string) as Recurrence)
        : undefined,
    })) as Task[];
  }

  /**
   * Updates an existing task by its unique identifier.
   *
   * Serializes recurrence and reminder fields as JSON strings for storage.
   * Normalizes date fields to ISO-8601 format.
   * Sets the completedAt field if the status is set to "completed".
   *
   * @param {string} id - The unique identifier of the task.
   * @param {UpdateTaskDto} updateTaskDto - Data Transfer Object containing update data.
   * @returns {Promise<Task>} The updated task entity.
   */
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const data: any = { ...updateTaskDto };

    if (updateTaskDto.status === "completed") {
      data.completedAt = new Date();
    }

    // Normalizar dueDate y autoDelete a ISO-8601
    if (data.dueDate) {
      data.dueDate =
        typeof data.dueDate === "string"
          ? new Date(data.dueDate).toISOString()
          : data.dueDate instanceof Date
            ? data.dueDate.toISOString()
            : undefined;
    }
    if (data.autoDelete) {
      data.autoDelete =
        typeof data.autoDelete === "string"
          ? new Date(data.autoDelete).toISOString()
          : data.autoDelete instanceof Date
            ? data.autoDelete.toISOString()
            : undefined;
    }

    if (data.recurrence) {
      data.recurrence = JSON.stringify(data.recurrence);
    }
    if (data.reminder) {
      data.reminder = JSON.stringify(data.reminder);
    }

    const task = await main.prisma.task.update({
      where: { id },
      data,
    });
    await this.notifier.sendWebhookNotification(
      "Task Updated",
      `Task with ID: \`${id}\` has been updated.`,
      "#2196F3",
      [
        {
          name: "Updated Fields",
          value: Object.keys(updateTaskDto).join(", ") || "None",
          inline: false,
        },
        { name: "Status", value: updateTaskDto.status || "Unchanged", inline: true },
      ],
      { content: "🔵 Task update event", username: "Task Service" },
    );
    return {
      ...task,
      reminder: task.reminder ? (JSON.parse(task.reminder as string) as Reminder) : undefined,
      recurrence: task.recurrence
        ? (JSON.parse(task.recurrence as string) as Recurrence)
        : undefined,
    } as Task;
  }

  /**
   * Deletes a task by its unique identifier.
   *
   * @param {string} id - The unique identifier of the task to delete.
   * @returns {Promise<void>} Resolves when the task is deleted.
   */
  async delete(id: string): Promise<void> {
    await main.prisma.task.delete({
      where: { id },
    });
    await this.notifier.sendWebhookNotification(
      "Task Deleted",
      `Task with ID: \`${id}\` has been deleted.`,
      "#F44336",
      [{ name: "Task ID", value: id, inline: true }],
      { content: "🔴 Task deletion event", username: "Task Service" },
    );
  }

  /**
   * Cleans up tasks that have an auto-delete date in the past.
   *
   * Deletes tasks where the autoDelete field is less than or equal to the current date.
   * @return {Promise<number>} The number of tasks deleted.
   */
  async cleanUp(): Promise<number> {
    const now = new Date();
    const result = await main.prisma.task.deleteMany({
      where: {
        autoDelete: {
          lte: now,
        },
      },
    });
    return result.count;
  }
}
