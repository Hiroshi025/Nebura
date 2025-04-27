"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const main_1 = require("../../../../main");
class TaskService {
    async createTask(createTaskDto) {
        const task = await main_1.main.prisma.task.create({
            data: {
                ...createTaskDto,
                recurrence: createTaskDto.recurrence ? JSON.stringify(createTaskDto.recurrence) : undefined,
                status: createTaskDto.status || "pending",
                priority: createTaskDto.priority || "medium",
                tags: createTaskDto.tags || [],
                reminder: createTaskDto.reminder ? JSON.stringify(createTaskDto.reminder) : undefined,
            },
        });
        return {
            ...task,
            recurrence: task.recurrence
                ? JSON.parse(task.recurrence)
                : undefined,
            reminder: task.reminder ? JSON.parse(task.reminder) : undefined,
        };
    }
    async getTaskById(id) {
        const task = await main_1.main.prisma.task.findUnique({
            where: { id },
        });
        return task;
    }
    async getAllTasks(filters = {}) {
        const { status, priority, createdBy, tag } = filters;
        const tasks = await main_1.main.prisma.task.findMany({
            where: {
                ...(status && { status }),
                ...(priority && { priority }),
                ...(createdBy && { createdBy }),
                ...(tag && { tags: { has: tag } }),
            }
        });
        return tasks.map((task) => ({
            ...task,
            reminder: task.reminder ? JSON.parse(task.reminder) : undefined,
            recurrence: task.recurrence
                ? JSON.parse(task.recurrence)
                : undefined,
        }));
    }
    async updateTask(id, updateTaskDto) {
        const data = { ...updateTaskDto };
        if (updateTaskDto.status === "completed") {
            data.completedAt = new Date();
        }
        const task = await main_1.main.prisma.task.update({
            where: { id },
            data,
        });
        return {
            ...task,
            reminder: task.reminder ? JSON.parse(task.reminder) : undefined,
            recurrence: task.recurrence
                ? JSON.parse(task.recurrence)
                : undefined,
        };
    }
    async deleteTask(id) {
        await main_1.main.prisma.task.delete({
            where: { id },
        });
    }
    async cleanUpTasks() {
        const now = new Date();
        const result = await main_1.main.prisma.task.deleteMany({
            where: {
                autoDelete: {
                    lte: now,
                },
            },
        });
        return result.count;
    }
}
exports.TaskService = TaskService;
