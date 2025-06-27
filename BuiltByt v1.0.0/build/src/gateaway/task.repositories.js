"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="ea3c0007-9859-53f9-a379-956043cfe742")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRepository = void 0;
const main_1 = require("../main");
/**
 * Implementación de TaskRepositoryInterface usando Prisma.
 */
class TaskRepository {
    async create(data) {
        const task = await main_1.main.prisma.task.create({ data });
        return {
            ...task,
            recurrence: task.recurrence
                ? JSON.parse(task.recurrence)
                : undefined,
            reminder: task.reminder ? JSON.parse(task.reminder) : undefined,
        };
    }
    async findById(id) {
        const task = await main_1.main.prisma.task.findUnique({ where: { id } });
        if (!task)
            return null;
        return {
            ...task,
            recurrence: task.recurrence
                ? JSON.parse(task.recurrence)
                : undefined,
            reminder: task.reminder ? JSON.parse(task.reminder) : undefined,
        };
    }
    async findMany(filters = {}) {
        const { status, priority, createdBy, tag } = filters;
        const tasks = await main_1.main.prisma.task.findMany({
            where: {
                ...(status && { status }),
                ...(priority && { priority }),
                ...(createdBy && { createdBy }),
                ...(tag && { tags: { has: tag } }),
            },
        });
        return tasks.map((task) => ({
            ...task,
            recurrence: task.recurrence
                ? JSON.parse(task.recurrence)
                : undefined,
            reminder: task.reminder ? JSON.parse(task.reminder) : undefined,
        }));
    }
    async update(id, data) {
        const task = await main_1.main.prisma.task.update({ where: { id }, data });
        return {
            ...task,
            recurrence: task.recurrence
                ? JSON.parse(task.recurrence)
                : undefined,
            reminder: task.reminder ? JSON.parse(task.reminder) : undefined,
        };
    }
    async delete(id) {
        await main_1.main.prisma.task.delete({ where: { id } });
    }
    async deleteManyAutoDeleteBefore(date) {
        const result = await main_1.main.prisma.task.deleteMany({
            where: { autoDelete: { lte: date.toISOString() } },
        });
        return result.count;
    }
}
exports.TaskRepository = TaskRepository;
//# sourceMappingURL=task.repositories.js.map
//# debugId=ea3c0007-9859-53f9-a379-956043cfe742
