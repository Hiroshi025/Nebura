"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="892ec93e-7d94-57d2-927c-20ca6552d43f")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskResponseDto = void 0;
class TaskResponseDto {
    id;
    title;
    description;
    createdBy;
    createdAt;
    dueDate;
    status;
    priority;
    tags;
    reminder;
    recurrence;
    autoDelete;
    updatedAt;
    completedAt;
    constructor(task) {
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
exports.TaskResponseDto = TaskResponseDto;
//# sourceMappingURL=task-response.dto.js.map
//# debugId=892ec93e-7d94-57d2-927c-20ca6552d43f
