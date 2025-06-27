import { Recurrence, Reminder } from "@domain/services/entities/tasks/task.entity";

export class CreateTaskDto {
  title: string = "";
  description?: string;
  createdBy: string = "";
  dueDate?: string;
  status?: "pending" | "completed" | "canceled";
  priority?: "low" | "medium" | "high";
  tags?: string[];
  reminder?: Reminder;
  recurrence?: Recurrence;
  autoDelete?: string;
}
