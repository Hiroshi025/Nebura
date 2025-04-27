"use strict";
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
