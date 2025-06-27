"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="4e88d61b-1d6c-51a1-bc63-71287e6b4e65")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const task_1 = require("../../../adapters/validators/task");
const task_repositories_1 = require("../../../gateaway/task.repositories");
const notification_1 = require("../../../interfaces/messaging/broker/notification"); // Importa Notification
/**
 * Service for managing tasks, including creation, retrieval, updating, deletion, and cleanup.
 *
 * Uses Prisma ORM for database operations.
 *
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client Prisma Client}
 */
class TaskService {
    notifier = new notification_1.Notification(); // Instancia de Notification
    repo = new task_repositories_1.TaskRepository();
    constructor() { }
    /**
     * Creates a new task in the database.
     *
     * Serializes recurrence and reminder fields as JSON strings for storage.
     * Normalizes date fields to ISO-8601 format.
     *
     * @param {CreateTaskDto} createTaskDto - Data Transfer Object containing task creation data.
     * @returns {Promise<Task>} The created task entity.
     */
    async create(createTaskDto) {
        // Validar recurrence si existe
        let valid;
        if (createTaskDto.recurrence) {
            valid = task_1.TaskRecurrence.safeParse(createTaskDto.recurrence);
            if (!valid.success)
                throw new Error("Invalid recurrence format");
            // Puedes usar valid.data si necesitas el valor parseado
        }
        // Validar reminder si existe
        let validReminder;
        if (createTaskDto.reminder) {
            validReminder = task_1.TaskReminder.safeParse(createTaskDto.reminder);
            if (!validReminder.success)
                throw new Error("Invalid reminder format");
            // Puedes usar validReminder.data si necesitas el valor parseado
        }
        const recurrence = valid?.data;
        const reminder = validReminder?.data;
        const data = {
            ...createTaskDto,
            createdBy: createTaskDto.createdBy,
            recurrence,
            status: createTaskDto.status || "pending",
            priority: createTaskDto.priority || "medium",
            tags: createTaskDto.tags || [],
            reminder,
            dueDate: createTaskDto.dueDate ? createTaskDto.dueDate : "Not set",
            autoDelete: createTaskDto.autoDelete ? createTaskDto.autoDelete : "Not set"
        };
        const task = await this.repo.create(data);
        // Notificación detallada en inglés
        await this.notifier.sendWebhookNotification("Task Created", `A new task has been created by user ID: \`${createTaskDto.createdBy}\`.`, "#4CAF50", [
            { name: "Title", value: createTaskDto.title || "No title", inline: true },
            {
                name: "Due Date",
                value: data.dueDate ? data.dueDate : "Not set",
                inline: true,
            },
            { name: "Priority", value: createTaskDto.priority || "medium", inline: true },
            {
                name: "Tags",
                value: createTaskDto.tags && createTaskDto.tags.length > 0
                    ? createTaskDto.tags.join(", ")
                    : "None",
                inline: false,
            },
        ], { content: "🟢 Task creation event", username: "Task Service" });
        return task;
    }
    /**
     * Retrieves a task by its unique identifier.
     *
     * @param {string} id - The unique identifier of the task.
     * @returns {Promise<Task | null>} The task entity if found, otherwise null.
     */
    async getById(id) {
        return this.repo.findById(id);
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
    async get(filters = {}) {
        return this.repo.findMany(filters);
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
    async update(id, updateTaskDto) {
        const data = { ...updateTaskDto };
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
        const task = await this.repo.update(id, data);
        await this.notifier.sendWebhookNotification("Task Updated", `Task with ID: \`${id}\` has been updated.`, "#2196F3", [
            {
                name: "Updated Fields",
                value: Object.keys(updateTaskDto).join(", ") || "None",
                inline: false,
            },
            { name: "Status", value: updateTaskDto.status || "Unchanged", inline: true },
        ], { content: "🔵 Task update event", username: "Task Service" });
        return task;
    }
    /**
     * Deletes a task by its unique identifier.
     *
     * @param {string} id - The unique identifier of the task to delete.
     * @returns {Promise<void>} Resolves when the task is deleted.
     */
    async delete(id) {
        await this.repo.delete(id);
        await this.notifier.sendWebhookNotification("Task Deleted", `Task with ID: \`${id}\` has been deleted.`, "#F44336", [{ name: "Task ID", value: id, inline: true }], { content: "🔴 Task deletion event", username: "Task Service" });
    }
    /**
     * Cleans up tasks that have an auto-delete date in the past.
     *
     * Deletes tasks where the autoDelete field is less than or equal to the current date.
     * @return {Promise<number>} The number of tasks deleted.
     */
    async cleanUp() {
        const now = new Date();
        return this.repo.deleteManyAutoDeleteBefore(now);
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=task.service.js.map
//# debugId=4e88d61b-1d6c-51a1-bc63-71287e6b4e65
