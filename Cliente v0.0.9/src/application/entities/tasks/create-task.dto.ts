import { Recurrence, Reminder } from "./task.entity";

export class CreateTaskDto {
  title: string = "";
  description?: string;
  createdBy: string = "";
  dueDate?: Date = new Date();
  status?: "pending" | "completed" | "canceled";
  priority?: "low" | "medium" | "high";
  tags?: string[];
  reminder?: Reminder;
  recurrence?: Recurrence;
  autoDelete?: Date;
}
