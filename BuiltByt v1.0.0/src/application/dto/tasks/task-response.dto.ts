import { Task } from "../../entities/tasks/task.entity";

export class TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  dueDate?: string;
  status: string;
  priority: string;
  tags: string[];
  reminder?: any;
  recurrence?: any;
  autoDelete?: string;
  updatedAt: Date;
  completedAt?: Date;

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
